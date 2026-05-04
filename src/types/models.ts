export interface UserProfile {
  uid: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  skills: string[];
  target_role: string;
  is_available_for_interview: boolean;
  timezone: string;
  availability: Array<{ weekday: number; start_time: string; end_time: string }>;
  email_verified: boolean;
  profile_completion_percentage: number;
  invite_eligible?: boolean;
  invite_eligibility_missing?: string[];
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface CreatePostBody {
  content: string;
  tags?: string[];
  groupId?: string;
}

export interface PostDocument {
  authorId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  tags: string[];
  groupId: string | null;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommentDocument {
  postId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  status: string;
  priority: 'High' | 'Medium' | 'Low';
  assigneeId?: string;
  dueDate?: string;
  position?: number;
}

export interface ProjectDocument {
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  visibility: 'Private' | 'Public';
  createdAt: string;
  updatedAt: string;
}

export interface InterviewSessionDocument {
  inviterId: string;
  inviteeId: string;
  proposedTimes: string;
  meetingLink: string;
  message?: string;
  topic?: string;
  status: 'pending' | 'accepted' | 'confirmed' | 'declined' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  
  // Denormalized profile data for easy UI rendering
  inviterName?: string;
  inviterEmail?: string;
  inviterAvatar?: string;
  inviterRole?: string;
  
  inviteeName?: string;
  inviteeEmail?: string;
  inviteeAvatar?: string;
  inviteeRole?: string;
}

export interface FeedbackDocument {
  sessionId: string;
  reviewerId: string;
  revieweeId: string;
  notes: string;
  tags: string[];
  scores: {
    problemSolving: number;
    communication: number;
    codeQuality?: number;
    technicalDepth?: number;
  };
  createdAt: string;
}

export interface ConversationDocument {
  participants: string[];
  recipientKey: string;
  recipientId: string | null;
  recipientName: string;
  recipientAvatar?: string;
  createdById: string;
  createdByName: string;
  createdByAvatar?: string;
  participantProfiles: Record<string, {
    name: string;
    avatar: string;
    email: string;
  }>;
  lastMessage: string;
  createdAt: string;
  updatedAt: string;
  unreadCounts: Record<string, number>;
  blockedBy: string[];
  hiddenFor: string[];
}

export interface MessageDocument {
  conversationId: string;
  senderId: string;
  text: string;
  readBy: string[];
  createdAt: string;
}

export interface GroupDocument {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: string[];
  memberIds: string[];
  memberProfiles: Record<string, any>;
  memberCount: number;
  blockedMembers: string[];
  blockedMemberIds: string[];
  visibility: string;
  tags?: string[];
  rules?: string[];
  coverImage?: string;
  maxMembers?: number;
  createdAt: string;
  updatedAt: string;
}
