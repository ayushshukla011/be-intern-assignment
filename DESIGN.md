# Database Design Document

## Entities and Relationships

### User
- **Fields:**
  - id (PK)
  - username
  - email
  - password (hashed)
  - createdAt
  - updatedAt
- **Relationships:**
  - OneToMany → Post (posts)
  - OneToMany → Follow (followers)
  - OneToMany → Follow (following)
  - OneToMany → Like (likes)
  - OneToMany → ActivityLog (activities)

### Post
- **Fields:**
  - id (PK)
  - content
  - userId (FK)
  - createdAt
  - updatedAt
- **Relationships:**
  - ManyToOne → User (user)
  - OneToMany → Like (likes)
  - ManyToMany → Hashtag (hashtags) through PostHashtag

### Follow
- **Fields:**
  - id (PK)
  - followerId (FK)
  - followedId (FK)
  - createdAt
- **Relationships:**
  - ManyToOne → User (follower)
  - ManyToOne → User (followed)

### Like
- **Fields:**
  - id (PK)
  - userId (FK)
  - postId (FK)
  - createdAt
- **Relationships:**
  - ManyToOne → User (user)
  - ManyToOne → Post (post)

### Hashtag
- **Fields:**
  - id (PK)
  - name (unique)
  - createdAt
- **Relationships:**
  - ManyToMany → Post (posts) through PostHashtag

### PostHashtag
- **Fields:**
  - postId (PK, FK)
  - hashtagId (PK, FK)
- **Relationships:**
  - ManyToOne → Post (post)
  - ManyToOne → Hashtag (hashtag)

### ActivityLog
- **Fields:**
  - id (PK)
  - userId (FK)
  - activityType (enum: POST_CREATE, POST_LIKE, USER_FOLLOW, USER_UNFOLLOW)
  - entityId (the ID of the related entity - post, like, follow)
  - createdAt
- **Relationships:**
  - ManyToOne → User (user)

## Indexing Strategy

### Primary & Foreign Key Indexes
- All primary keys (id fields) are automatically indexed
- Foreign key fields are indexed to speed up relationship queries:
  - `userId` in Post
  - `followerId` and `followedId` in Follow
  - `userId` and `postId` in Like
  - `postId` and `hashtagId` in PostHashtag
  - `userId` in ActivityLog

### Composite Indexes
- `(followerId, followedId)` in Follow - Prevents duplicate follows and speeds up follow status checks
- `(userId, postId)` in Like - Prevents duplicate likes and enables faster like status retrieval
- `(followerId, createdAt)` in Follow - Optimizes feed generation by quickly finding followed users' posts
- `(userId, activityType, createdAt)` in ActivityLog - Enhances activity filtering and chronological sorting

### Performance-Specific Indexes
- `createdAt` in Post - Accelerates feed sorting by creation date
- `name` in Hashtag - Improves hashtag search performance, especially for case-insensitive searches
- `followerId` in Follow - Faster retrieval of users that the current user follows
- `followedId` in Follow - Optimizes follower count and follower list retrieval
- `userId` in Like - Efficiently finds all posts liked by a specific user
- `postId` in Like - Speeds up fetching all users who liked a specific post

### Unique Constraints
- `email` and `username` in User - Enforces user uniqueness
- `name` in Hashtag - Prevents duplicate hashtags
- `(userId, postId)` composite unique constraint in Like - Prevents a user from liking a post multiple times
- `(followerId, followedId)` composite unique constraint in Follow - Prevents duplicate follow relationships

## Rationale for Indexing Choices

1. **Foreign Key Indexing:**
   - Foreign key fields are indexed because they are frequently used in JOIN operations and WHERE clauses
   - This significantly improves query performance when fetching related entities

2. **Composite Indexes:**
   - Created for columns that are frequently queried together
   - Support the main access patterns (e.g., finding if a user has liked a post or follows another user)
   - Used to enforce business rules (like preventing duplicate likes)

3. **Sort-Supporting Indexes:**
   - Added on columns used for sorting (e.g., `createdAt`) to avoid full table scans during ORDER BY operations
   - Critical for feed generation where posts need to be sorted by recency

4. **Search Optimization:**
   - The index on Hashtag `name` supports efficient hashtag searches
   - Enables faster text-based queries, especially important for the hashtag search feature

## Query Pattern Examples

1. **Feed Generation:**
   ```sql
   -- Find posts from users the current user follows
   SELECT p.* FROM posts p
   JOIN follows f ON p.userId = f.followedId
   WHERE f.followerId = ? 
   ORDER BY p.createdAt DESC
   LIMIT ? OFFSET ?
   ```
   *Uses indexes: `followerId` in Follow, `createdAt` in Post*

2. **Post Like Status:**
   ```sql
   -- Check if a user has liked a post
   SELECT * FROM likes 
   WHERE userId = ? AND postId = ?
   ```
   *Uses composite index: `(userId, postId)` in Like*

3. **Hashtag Search:**
   ```sql
   -- Find posts with a specific hashtag
   SELECT p.* FROM posts p
   JOIN post_hashtags ph ON p.id = ph.postId
   JOIN hashtags h ON ph.hashtagId = h.id
   WHERE LOWER(h.name) = LOWER(?)
   ```
   *Uses index: `name` in Hashtag*

4. **User Activity History:**
   ```sql
   -- Get user's activity filtered by type and date range
   SELECT * FROM activity_logs
   WHERE userId = ? AND activityType = ?
   AND createdAt BETWEEN ? AND ?
   ORDER BY createdAt DESC
   ```
   *Uses composite index: `(userId, activityType, createdAt)` in ActivityLog*

## Scalability Considerations

1. **Pagination:**
   - All list endpoints implement offset/limit pagination to handle large datasets
   - Properly indexed columns support efficient pagination

2. **Efficient Feed Generation:**
   - Feed queries use composite indexes to efficiently fetch posts from followed users
   - The `(followerId, createdAt)` index enables fast retrieval of recent posts from followed users
   - Future enhancement: Implement caching for feed data to reduce database load

3. **Activity Tracking:**
   - Composite indexes on ActivityLog enable efficient filtering by user, activity type, and date range
   - Critical for performance as activity logs grow over time

4. **Query Optimization:**
   - Indexes support the specific query patterns used by the application
   - Careful selection of entity relationships to prevent N+1 query problems
   - Strategic use of composite indexes where multiple columns are frequently queried together

5. **Future Considerations:**
   - For large-scale deployment, consider database sharding by user ID
   - Implement read replicas for scaling read operations
   - Consider introducing cache layers (Redis/Memcached) for frequently accessed data
   - Consider moving certain features to specialized databases (e.g., graph database for social relationships)
