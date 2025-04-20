import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from "typeorm";
import { PostHashtag } from "./PostHashtag";

@Entity("hashtags")
export class Hashtag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @OneToMany(() => PostHashtag, postHashtag => postHashtag.hashtag)
  postHashtags: PostHashtag[];

  @CreateDateColumn()
  createdAt: Date;
} 