import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttachment {
  filename: string;
  originalName: string;
  path: string;
  mimetype: string;
  size: number;
}

export interface IReaction {
  userId: mongoose.Types.ObjectId;
  type: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';
  createdAt: Date;
}

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  receiver?: mongoose.Types.ObjectId;
  groupId?: mongoose.Types.ObjectId;
  content: string;
  attachments?: IAttachment[];
  isRead: boolean;
  isGroupMessage: boolean;
  deletedBy?: mongoose.Types.ObjectId[];
  // New fields for Messenger-like features
  reactions?: IReaction[];
  replyTo?: mongoose.Types.ObjectId;
  forwardedFrom?: mongoose.Types.ObjectId;
  status: 'sending' | 'sent' | 'delivered' | 'seen';
  seenBy?: Array<{
    userId: mongoose.Types.ObjectId;
    seenAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      validate: {
        validator: function(this: IMessage, v: any) {
          // receiver is required only if it's not a group message
          return this.isGroupMessage || v != null;
        },
        message: 'Receiver is required for non-group messages'
      }
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      validate: {
        validator: function(this: IMessage, v: any) {
          // groupId is required only if it's a group message
          return !this.isGroupMessage || v != null;
        },
        message: 'GroupId is required for group messages'
      }
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    attachments: [
      {
        filename: String,
        originalName: String,
        path: String,
        mimetype: String,
        size: Number,
      },
    ],
    isRead: {
      type: Boolean,
      default: false,
    },
    isGroupMessage: {
      type: Boolean,
      default: false,
    },
    deletedBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    // New fields for Messenger-like features
    reactions: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      type: {
        type: String,
        enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    forwardedFrom: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    status: {
      type: String,
      enum: ['sending', 'sent', 'delivered', 'seen'],
      default: 'sent',
    },
    seenBy: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      seenAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
MessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
MessageSchema.index({ groupId: 1, createdAt: -1 });
MessageSchema.index({ receiver: 1, isRead: 1 });
MessageSchema.index({ receiver: 1, isRead: 1, deletedBy: 1 });
MessageSchema.index({ replyTo: 1 }); // For fetching replied messages
MessageSchema.index({ 'reactions.userId': 1 }); // For reaction queries

const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
