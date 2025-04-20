import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn, Index } from "typeorm";
import { User } from "./User";

export enum ActivityType {
  POST_CREATE = "POST_CREATE",
  POST_LIKE = "POST_LIKE",
  USER_FOLLOW = "USER_FOLLOW",
  USER_UNFOLLOW = "USER_UNFOLLOW"
}

@Entity("activity_logs")
@Index(["userId", "activityType", "createdAt"])
export class ActivityLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({
    type: "varchar",
    enum: ActivityType
  })
  activityType: ActivityType;

  @Column()
  entityId: number;

  @ManyToOne(() => User, user => user.activities)
  @JoinColumn({ name: "userId" })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
} 