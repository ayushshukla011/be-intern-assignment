import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn, Unique } from "typeorm";
import { User } from "./User";

@Entity("follows")
@Unique(["followerId", "followedId"])
export class Follow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  followerId: number;

  @Column()
  followedId: number;

  @ManyToOne(() => User, user => user.following)
  @JoinColumn({ name: "followerId" })
  follower: User;

  @ManyToOne(() => User, user => user.followers)
  @JoinColumn({ name: "followedId" })
  followed: User;

  @CreateDateColumn()
  createdAt: Date;
} 