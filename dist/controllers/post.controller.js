"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComment = exports.updateComment = exports.listComments = exports.addComment = exports.deletePost = exports.updatePost = exports.toggleLike = exports.createPost = exports.listPosts = void 0;
const firebase_1 = require("../config/firebase");
const firebase_2 = require("../config/firebase");
const api_error_1 = require("../utils/api-error");
const request_1 = require("../utils/request");
const listPosts = async (_req, res) => {
    try {
        const groupId = typeof _req.query.groupId === "string" ? _req.query.groupId : null;
        const cursor = typeof _req.query.cursor === "string" ? _req.query.cursor : null;
        const limit = 20;
        let query = firebase_1.db.collection("posts").orderBy("createdAt", "desc");
        if (cursor) {
            query = query.startAfter(cursor);
        }
        const snapshot = await query.limit(100).get();
        let posts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        if (groupId) {
            posts = posts.filter(p => p.groupId === groupId);
        }
        else {
            posts = posts.filter(p => p.groupId == null);
        }
        const nextCursor = snapshot.docs.length === 100 ? (snapshot.docs[snapshot.docs.length - 1]?.data().createdAt ?? null) : null;
        posts = posts.slice(0, limit);
        res.status(200).json({ posts, nextCursor });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: "Failed to list posts" });
    }
};
exports.listPosts = listPosts;
const createPost = async (req, res) => {
    try {
        const user = (0, request_1.requireUser)(req);
        const body = req.body;
        const content = (0, request_1.getString)(body.content, "content");
        const now = new Date().toISOString();
        // const now = firestoreAdmin.FieldValue.serverTimestamp();
        const userDoc = await firebase_1.db.collection("users").doc(user.uid).get();
        const authorName = userDoc.exists
            ? String(userDoc.data()?.name ?? "User")
            : "User";
        const payload = {
            authorId: user.uid,
            authorName,
            authorEmail: user.email,
            content,
            tags: Array.isArray(body.tags)
                ? body.tags.filter((tag) => typeof tag === "string")
                : [],
            groupId: typeof body.groupId === "string" ? body.groupId : null,
            likeCount: 0,
            commentCount: 0,
            createdAt: now,
            updatedAt: now,
        };
        const docRef = await firebase_1.db.collection("posts").add(payload);
        res.status(201).json({ id: docRef.id, ...payload });
    }
    catch (error) {
        if (error instanceof api_error_1.ApiError) {
            res.status(error.statusCode).json({ message: error.message });
            return;
        }
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: "Failed to create post" });
    }
};
exports.createPost = createPost;
const toggleLike = async (req, res) => {
    try {
        const user = (0, request_1.requireUser)(req);
        const postId = (0, request_1.getString)(req.params.postId, "postId");
        const postRef = firebase_1.db.collection("posts").doc(postId);
        const likeRef = postRef.collection("likes").doc(user.uid);
        let likeCount = 0;
        let likedByMe = false;
        await firebase_1.db.runTransaction(async (transaction) => {
            const postDoc = await transaction.get(postRef);
            if (!postDoc.exists) {
                throw new api_error_1.ApiError(404, "Post not found");
            }
            const likeDoc = await transaction.get(likeRef);
            const currentLikeCount = Number(postDoc.data()?.likeCount ?? 0);
            if (likeDoc.exists) {
                transaction.delete(likeRef);
                likeCount = Math.max(currentLikeCount - 1, 0);
                likedByMe = false;
                transaction.update(postRef, {
                    likeCount,
                    updatedAt: new Date().toISOString(),
                });
            }
            else {
                transaction.set(likeRef, {
                    userId: user.uid,
                    createdAt: new Date().toISOString(),
                });
                likeCount = currentLikeCount + 1;
                likedByMe = true;
                transaction.update(postRef, {
                    likeCount,
                    updatedAt: new Date().toISOString(),
                });
            }
        });
        res
            .status(200)
            .json({ message: "Like state updated", likeCount, likedByMe });
    }
    catch (error) {
        if (error instanceof api_error_1.ApiError) {
            res.status(error.statusCode).json({ message: error.message });
            return;
        }
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: "Failed to update like" });
    }
};
exports.toggleLike = toggleLike;
const updatePost = async (req, res) => {
    try {
        const user = (0, request_1.requireUser)(req);
        const postId = (0, request_1.getString)(req.params.postId, "postId");
        const content = (0, request_1.getString)(req.body.content, "content");
        const postRef = firebase_1.db.collection("posts").doc(postId);
        const postDoc = await postRef.get();
        if (!postDoc.exists) {
            throw new api_error_1.ApiError(404, "Post not found");
        }
        const postData = postDoc.data();
        if (postData.authorId !== user.uid) {
            throw new api_error_1.ApiError(403, "Only author can update post");
        }
        const updatedAt = new Date().toISOString();
        await postRef.set({ content, updatedAt }, { merge: true });
        res.status(200).json({ id: postId, ...postData, content, updatedAt });
    }
    catch (error) {
        if (error instanceof api_error_1.ApiError) {
            res.status(error.statusCode).json({ message: error.message });
            return;
        }
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: "Failed to update post" });
    }
};
exports.updatePost = updatePost;
const deletePost = async (req, res) => {
    try {
        const user = (0, request_1.requireUser)(req);
        const postId = (0, request_1.getString)(req.params.postId, "postId");
        const postRef = firebase_1.db.collection("posts").doc(postId);
        const postDoc = await postRef.get();
        if (!postDoc.exists) {
            throw new api_error_1.ApiError(404, "Post not found");
        }
        const postData = postDoc.data();
        if (postData.authorId !== user.uid) {
            throw new api_error_1.ApiError(403, "Only author can delete post");
        }
        await postRef.delete();
        res.status(200).json({ message: "Post deleted" });
    }
    catch (error) {
        if (error instanceof api_error_1.ApiError) {
            res.status(error.statusCode).json({ message: error.message });
            return;
        }
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: "Failed to delete post" });
    }
};
exports.deletePost = deletePost;
const addComment = async (req, res) => {
    try {
        const user = (0, request_1.requireUser)(req);
        const postId = (0, request_1.getString)(req.params.postId, "postId");
        const text = (0, request_1.getString)(req.body.text, "text");
        const userDoc = await firebase_1.db.collection("users").doc(user.uid).get();
        const authorName = userDoc.exists
            ? String(userDoc.data()?.name ?? "User")
            : "User";
        const now = new Date().toISOString();
        const commentPayload = {
            postId,
            authorId: user.uid,
            authorName,
            text,
            createdAt: now,
        };
        const commentRef = await firebase_1.db
            .collection("posts")
            .doc(postId)
            .collection("comments")
            .add(commentPayload);
        await firebase_1.db
            .collection("posts")
            .doc(postId)
            .set({
            commentCount: firebase_2.firestoreAdmin.FieldValue.increment(1),
            updatedAt: now,
        }, { merge: true });
        res.status(201).json({ id: commentRef.id, ...commentPayload });
    }
    catch (error) {
        if (error instanceof api_error_1.ApiError) {
            res.status(error.statusCode).json({ message: error.message });
            return;
        }
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: "Failed to add comment" });
    }
};
exports.addComment = addComment;
const listComments = async (req, res) => {
    try {
        const postId = (0, request_1.getString)(req.params.postId, "postId");
        const snapshot = await firebase_1.db
            .collection("posts")
            .doc(postId)
            .collection("comments")
            .orderBy("createdAt", "asc")
            .get();
        const comments = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        res.status(200).json(comments);
    }
    catch (error) {
        if (error instanceof api_error_1.ApiError) {
            res.status(error.statusCode).json({ message: error.message });
            return;
        }
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: "Failed to list comments" });
    }
};
exports.listComments = listComments;
const updateComment = async (req, res) => {
    try {
        const user = (0, request_1.requireUser)(req);
        const postId = (0, request_1.getString)(req.params.postId, "postId");
        const commentId = (0, request_1.getString)(req.params.commentId, "commentId");
        const text = (0, request_1.getString)(req.body.text, "text");
        const commentRef = firebase_1.db
            .collection("posts")
            .doc(postId)
            .collection("comments")
            .doc(commentId);
        const commentDoc = await commentRef.get();
        if (!commentDoc.exists) {
            throw new api_error_1.ApiError(404, "Comment not found");
        }
        const commentData = commentDoc.data();
        if (commentData.authorId !== user.uid) {
            throw new api_error_1.ApiError(403, "Only author can update comment");
        }
        await commentRef.set({ text, updatedAt: new Date().toISOString() }, { merge: true });
        res.status(200).json({ id: commentId, ...commentData, text });
    }
    catch (error) {
        if (error instanceof api_error_1.ApiError) {
            res.status(error.statusCode).json({ message: error.message });
            return;
        }
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: "Failed to update comment" });
    }
};
exports.updateComment = updateComment;
const deleteComment = async (req, res) => {
    try {
        const user = (0, request_1.requireUser)(req);
        const postId = (0, request_1.getString)(req.params.postId, "postId");
        const commentId = (0, request_1.getString)(req.params.commentId, "commentId");
        const commentRef = firebase_1.db
            .collection("posts")
            .doc(postId)
            .collection("comments")
            .doc(commentId);
        const commentDoc = await commentRef.get();
        if (!commentDoc.exists) {
            throw new api_error_1.ApiError(404, "Comment not found");
        }
        const commentData = commentDoc.data();
        if (commentData.authorId !== user.uid) {
            throw new api_error_1.ApiError(403, "Only author can delete comment");
        }
        await commentRef.delete();
        await firebase_1.db
            .collection("posts")
            .doc(postId)
            .set({
            commentCount: firebase_2.firestoreAdmin.FieldValue.increment(-1),
            updatedAt: new Date().toISOString(),
        }, { merge: true });
        res.status(200).json({ message: "Comment deleted" });
    }
    catch (error) {
        if (error instanceof api_error_1.ApiError) {
            res.status(error.statusCode).json({ message: error.message });
            return;
        }
        if (error instanceof Error) {
            res.status(500).json({ message: error.message });
            return;
        }
        res.status(500).json({ message: "Failed to delete comment" });
    }
};
exports.deleteComment = deleteComment;
//# sourceMappingURL=post.controller.js.map