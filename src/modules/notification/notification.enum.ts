export const NotificationTypeEnum = {
	FRIEND_REQUEST: 'FRIEND_REQUEST',
	FRIEND_ACCEPTED: 'FRIEND_ACCEPTED',

	POST_REACT: 'POST_REACT',
	POST_COMMENT: 'POST_COMMENT',
	POST_TAGGED: 'POST_TAGGED',

	COMMENT_REACT: 'COMMENT_REACT',
	COMMENT_REPLAY: 'COMMENT_REPLAY',
	COMMENT_TAGGED: 'COMMENT_TAGGED',
} as const;

export type NotificationTypeEnum = (typeof NotificationTypeEnum)[keyof typeof NotificationTypeEnum];
