import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from "typeorm";
import { Post } from "./Post";
import { Hashtag } from "./Hashtag";

@Entity("post_hashtags")
export class PostHashtag {
  @PrimaryColumn()
  postId: number;

  @PrimaryColumn()
  hashtagId: number;

  @ManyToOne(() => Post, post => post.postHashtags)
  @JoinColumn({ name: "postId" })
  post: Post;

  @ManyToOne(() => Hashtag, hashtag => hashtag.postHashtags)
  @JoinColumn({ name: "hashtagId" })
  hashtag: Hashtag;
} 