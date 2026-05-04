import type { Request, Response } from "express";
import { db } from "../config/firebase";
import { firestoreAdmin } from "../config/firebase";
import type {
  CommentDocument,
  CreatePostBody,
  PostDocument,
} from "../types/models";
import { ApiError } from "../utils/api-error";
import { getString, requireUser } from "../utils/request";

export const listPosts = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const groupId = typeof _req.query.groupId === "string" ? _req.query.groupId : null;
    const cursor = typeof _req.query.cursor === "string" ? _req.query.cursor : null;
    const limit = 20;

    let query: FirebaseFirestore.Query = db.collection("posts").orderBy("createdAt", "desc");

    if (cursor) {
      query = query.startAfter(cursor);
    }

    const snapshot = await query.limit(100).get();

    let posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Array<{ id: string } & PostDocument>;

    if (groupId) {
      posts = posts.filter(p => p.groupId === groupId);
    } else {
      posts = posts.filter(p => p.groupId == null);
    }

    const nextCursor = snapshot.docs.length === 100 ? (snapshot.docs[snapshot.docs.length - 1]?.data().createdAt ?? null) : null;

    posts = posts.slice(0, limit);

    res.status(200).json({ posts, nextCursor });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: "Failed to list posts" });
  }
};

export const createPost = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = requireUser(req);
    const body = req.body as CreatePostBody;
    const content = getString(body.content, "content");
    const now = new Date().toISOString();
    // const now = firestoreAdmin.FieldValue.serverTimestamp();

    const userDoc = await db.collection("users").doc(user.uid).get();
    const authorName = userDoc.exists
      ? String(userDoc.data()?.name ?? "User")
      : "User";

    const payload: PostDocument = {
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

    const docRef = await db.collection("posts").add(payload);
    res.status(201).json({ id: docRef.id, ...payload });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
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

export const toggleLike = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = requireUser(req);
    const postId = getString(req.params.postId, "postId");
    const postRef = db.collection("posts").doc(postId);
    const likeRef = postRef.collection("likes").doc(user.uid);

    let likeCount = 0;
    let likedByMe = false;
    await db.runTransaction(async (transaction) => {
      const postDoc = await transaction.get(postRef);
      if (!postDoc.exists) {
        throw new ApiError(404, "Post not found");
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
      } else {
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
  } catch (error: unknown) {
    if (error instanceof ApiError) {
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

export const updatePost = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = requireUser(req);
    const postId = getString(req.params.postId, "postId");
    const content = getString(
      (req.body as Record<string, unknown>).content,
      "content",
    );
    const postRef = db.collection("posts").doc(postId);
    const postDoc = await postRef.get();
    if (!postDoc.exists) {
      throw new ApiError(404, "Post not found");
    }

    const postData = postDoc.data() as PostDocument;
    if (postData.authorId !== user.uid) {
      throw new ApiError(403, "Only author can update post");
    }

    const updatedAt = new Date().toISOString();
    await postRef.set({ content, updatedAt }, { merge: true });
    res.status(200).json({ id: postId, ...postData, content, updatedAt });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
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

export const deletePost = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = requireUser(req);
    const postId = getString(req.params.postId, "postId");
    const postRef = db.collection("posts").doc(postId);
    const postDoc = await postRef.get();
    if (!postDoc.exists) {
      throw new ApiError(404, "Post not found");
    }
    const postData = postDoc.data() as PostDocument;
    if (postData.authorId !== user.uid) {
      throw new ApiError(403, "Only author can delete post");
    }
    await postRef.delete();
    res.status(200).json({ message: "Post deleted" });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
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

export const addComment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = requireUser(req);
    const postId = getString(req.params.postId, "postId");
    const text = getString((req.body as Record<string, unknown>).text, "text");
    const userDoc = await db.collection("users").doc(user.uid).get();
    const authorName = userDoc.exists
      ? String(userDoc.data()?.name ?? "User")
      : "User";
    const now = new Date().toISOString();

    const commentPayload: CommentDocument = {
      postId,
      authorId: user.uid,
      authorName,
      text,
      createdAt: now,
    };

    const commentRef = await db
      .collection("posts")
      .doc(postId)
      .collection("comments")
      .add(commentPayload);
    await db
      .collection("posts")
      .doc(postId)
      .set(
        {
          commentCount: firestoreAdmin.FieldValue.increment(1),
          updatedAt: now,
        },
        { merge: true },
      );

    res.status(201).json({ id: commentRef.id, ...commentPayload });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
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

export const listComments = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const postId = getString(req.params.postId, "postId");
    const snapshot = await db
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
  } catch (error: unknown) {
    if (error instanceof ApiError) {
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

export const updateComment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = requireUser(req);
    const postId = getString(req.params.postId, "postId");
    const commentId = getString(req.params.commentId, "commentId");
    const text = getString((req.body as Record<string, unknown>).text, "text");
    const commentRef = db
      .collection("posts")
      .doc(postId)
      .collection("comments")
      .doc(commentId);
    const commentDoc = await commentRef.get();
    if (!commentDoc.exists) {
      throw new ApiError(404, "Comment not found");
    }
    const commentData = commentDoc.data() as CommentDocument;
    if (commentData.authorId !== user.uid) {
      throw new ApiError(403, "Only author can update comment");
    }
    await commentRef.set(
      { text, updatedAt: new Date().toISOString() },
      { merge: true },
    );
    res.status(200).json({ id: commentId, ...commentData, text });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
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

export const deleteComment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = requireUser(req);
    const postId = getString(req.params.postId, "postId");
    const commentId = getString(req.params.commentId, "commentId");
    const commentRef = db
      .collection("posts")
      .doc(postId)
      .collection("comments")
      .doc(commentId);
    const commentDoc = await commentRef.get();
    if (!commentDoc.exists) {
      throw new ApiError(404, "Comment not found");
    }
    const commentData = commentDoc.data() as CommentDocument;
    if (commentData.authorId !== user.uid) {
      throw new ApiError(403, "Only author can delete comment");
    }
    await commentRef.delete();
    await db
      .collection("posts")
      .doc(postId)
      .set(
        {
          commentCount: firestoreAdmin.FieldValue.increment(-1),
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    res.status(200).json({ message: "Comment deleted" });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
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
