#!/bin/bash

# Base URLs
BASE_URL="http://localhost:3000/api"
USERS_URL="$BASE_URL/users"
POSTS_URL="$BASE_URL/posts"
LIKES_URL="$BASE_URL/likes"
FOLLOWS_URL="$BASE_URL/follows"
HASHTAGS_URL="$BASE_URL/hashtags"
FEED_URL="$BASE_URL/feed"

# Test data
AUTH_TOKEN=""
CURRENT_USER_ID=""
TEST_POST_ID=""
TEST_HASHTAG_ID=""
TEST_FOLLOW_ID=""
TEST_LIKE_ID=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
    echo -e "\n${GREEN}=== $1 ===${NC}"
}

print_subheader() {
    echo -e "\n${BLUE}--- $1 ---${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}! $1${NC}"
}

# Function to make API requests
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth=${4:-true}
    
    echo -e "${YELLOW}Request: $method $endpoint${NC}"
    if [ -n "$data" ]; then
        echo -e "${YELLOW}Data: $data${NC}"
    fi
    
    local auth_header=""
    if [ "$auth" = true ] && [ -n "$AUTH_TOKEN" ]; then
        auth_header="-H \"Authorization: Bearer $AUTH_TOKEN\""
    fi
    
    local response=""
    if [ "$method" = "GET" ]; then
        if [ "$auth" = true ] && [ -n "$AUTH_TOKEN" ]; then
            response=$(curl -s -X $method "$endpoint" -H "Authorization: Bearer $AUTH_TOKEN")
        else
            response=$(curl -s -X $method "$endpoint")
        fi
    else
        if [ "$auth" = true ] && [ -n "$AUTH_TOKEN" ]; then
            response=$(curl -s -X $method "$endpoint" -H "Content-Type: application/json" -H "Authorization: Bearer $AUTH_TOKEN" -d "$data")
        else
            response=$(curl -s -X $method "$endpoint" -H "Content-Type: application/json" -d "$data")
        fi
    fi
    
    # Display the raw response
    echo "$response"
    echo ""
    
    # Return the response for further processing
    echo "$response"
}

# Function to extract values from JSON using grep
extract_json_value() {
    local json=$1
    local key=$2
    
    # Simple pattern matching to extract value - works for basic JSON
    # This isn't perfect, but should work for standard API responses
    echo "$json" | grep -o "\"$key\":[^,}]*" | cut -d":" -f2- | sed 's/^[[:space:]]*//;s/[[:space:]]*$//;s/^"//;s/"$//'
}

# Authentication
test_login() {
    print_header "Logging In"
    read -p "Enter email: " email
    read -s -p "Enter password: " password
    echo ""
    
    local login_data=$(cat <<EOF
{
    "email": "$email",
    "password": "$password"
}
EOF
)
    local response=$(curl -s -X POST "$USERS_URL/login" -H "Content-Type: application/json" -d "$login_data")
    echo "$response"
    
    # Extract token
    AUTH_TOKEN=$(extract_json_value "$response" "token")
    
    # Extract user ID from the nested user object
    CURRENT_USER_ID=$(echo "$response" | grep -o "\"id\":[^,}]*" | head -1 | cut -d":" -f2- | sed 's/^[[:space:]]*//;s/[[:space:]]*$//;s/^"//;s/"$//')
    
    if [ -n "$AUTH_TOKEN" ] && [ "$AUTH_TOKEN" != "null" ]; then
        print_success "Login successful! Token saved for future requests."
        echo "Current user ID: $CURRENT_USER_ID"
    else
        print_error "Login failed. Please check your credentials or verify that the user exists."
        echo "Make sure to register first if you haven't already."
    fi
}

test_register() {
    print_header "Registering New User"
    read -p "Enter first name: " firstName
    read -p "Enter last name: " lastName
    read -p "Enter email: " email
    read -s -p "Enter password: " password
    echo ""
    
    local register_data=$(cat <<EOF
{
    "firstName": "$firstName",
    "lastName": "$lastName",
    "email": "$email",
    "password": "$password"
}
EOF
)
    local response=$(curl -s -X POST "$USERS_URL/register" -H "Content-Type: application/json" -d "$register_data")
    echo "$response"
    
    # Check if registration was successful
    if echo "$response" | grep -q "\"id\""; then
        print_success "User registered successfully!"
    else
        print_error "Registration failed. Please check the error message above."
    fi
}

# User-related functions
test_get_all_users() {
    print_header "Testing GET all users"
    make_request "GET" "$USERS_URL"
}

test_get_user() {
    print_header "Testing GET user by ID"
    read -p "Enter user ID: " user_id
    make_request "GET" "$USERS_URL/$user_id"
}

test_create_user() {
    print_header "Testing POST create user"
    read -p "Enter first name: " firstName
    read -p "Enter last name: " lastName
    read -p "Enter email: " email
    read -s -p "Enter password: " password
    echo ""
    
    local user_data=$(cat <<EOF
{
    "firstName": "$firstName",
    "lastName": "$lastName",
    "email": "$email",
    "password": "$password"
}
EOF
)
    make_request "POST" "$USERS_URL" "$user_data"
}

test_update_user() {
    print_header "Testing PUT update user"
    read -p "Enter user ID to update: " user_id
    read -p "Enter new first name (press Enter to keep current): " firstName
    read -p "Enter new last name (press Enter to keep current): " lastName
    read -p "Enter new email (press Enter to keep current): " email
    
    local update_data="{"
    local has_data=false
    
    if [ -n "$firstName" ]; then
        update_data+="\"firstName\": \"$firstName\""
        has_data=true
    fi
    
    if [ -n "$lastName" ]; then
        if [ "$has_data" = true ]; then
            update_data+=","
        fi
        update_data+="\"lastName\": \"$lastName\""
        has_data=true
    fi
    
    if [ -n "$email" ]; then
        if [ "$has_data" = true ]; then
            update_data+=","
        fi
        update_data+="\"email\": \"$email\""
        has_data=true
    fi
    
    update_data+="}"
    
    make_request "PUT" "$USERS_URL/$user_id" "$update_data"
}

test_delete_user() {
    print_header "Testing DELETE user"
    read -p "Enter user ID to delete: " user_id
    make_request "DELETE" "$USERS_URL/$user_id"
}

# Post-related functions
test_get_all_posts() {
    print_header "Testing GET all posts"
    make_request "GET" "$POSTS_URL"
}

test_get_post() {
    print_header "Testing GET post by ID"
    read -p "Enter post ID: " post_id
    make_request "GET" "$POSTS_URL/$post_id"
}

test_create_post() {
    print_header "Testing POST create post"
    read -p "Enter content: " content
    read -p "Enter hashtags (comma-separated, no spaces): " hashtags_input
    
    # Convert comma-separated hashtags to JSON array
    local hashtags_array=""
    if [ -n "$hashtags_input" ]; then
        IFS=',' read -ra HASHTAGS <<< "$hashtags_input"
        hashtags_array="["
        for i in "${!HASHTAGS[@]}"; do
            if [ $i -gt 0 ]; then
                hashtags_array+=","
            fi
            hashtags_array+="\"${HASHTAGS[$i]}\""
        done
        hashtags_array+="]"
    fi
    
    local post_data=""
    if [ -n "$hashtags_array" ]; then
        post_data=$(cat <<EOF
{
    "content": "$content",
    "hashtags": $hashtags_array
}
EOF
)
    else
        post_data=$(cat <<EOF
{
    "content": "$content"
}
EOF
)
    fi
    
    local response=$(curl -s -X POST "$POSTS_URL" -H "Content-Type: application/json" -H "Authorization: Bearer $AUTH_TOKEN" -d "$post_data")
    echo "$response"
    
    # Store post ID for later use
    TEST_POST_ID=$(extract_json_value "$response" "id")
    if [ -n "$TEST_POST_ID" ] && [ "$TEST_POST_ID" != "null" ]; then
        print_success "Post created with ID: $TEST_POST_ID"
    fi
}

test_update_post() {
    print_header "Testing PUT update post"
    read -p "Enter post ID to update: " post_id
    read -p "Enter new content: " content
    
    local post_data=$(cat <<EOF
{
    "content": "$content"
}
EOF
)
    make_request "PUT" "$POSTS_URL/$post_id" "$post_data"
}

test_delete_post() {
    print_header "Testing DELETE post"
    read -p "Enter post ID to delete: " post_id
    make_request "DELETE" "$POSTS_URL/$post_id"
    echo "Post deleted successfully."
}

# Like-related functions
test_get_all_likes() {
    print_header "Testing GET all likes"
    make_request "GET" "$LIKES_URL"
}

test_get_like() {
    print_header "Testing GET like by ID"
    read -p "Enter like ID: " like_id
    make_request "GET" "$LIKES_URL/$like_id"
}

test_create_like() {
    print_header "Testing POST create like"
    read -p "Enter post ID to like: " post_id
    
    local like_data=$(cat <<EOF
{
    "postId": $post_id
}
EOF
)
    local response=$(curl -s -X POST "$LIKES_URL" -H "Content-Type: application/json" -H "Authorization: Bearer $AUTH_TOKEN" -d "$like_data")
    echo "$response"
    
    # Store like ID for later use
    TEST_LIKE_ID=$(extract_json_value "$response" "id")
    if [ -n "$TEST_LIKE_ID" ] && [ "$TEST_LIKE_ID" != "null" ]; then
        print_success "Like created with ID: $TEST_LIKE_ID"
    fi
}

test_delete_like() {
    print_header "Testing DELETE like"
    read -p "Enter like ID to delete: " like_id
    make_request "DELETE" "$LIKES_URL/$like_id"
    echo "Like deleted successfully."
}

# Hashtag-related functions
test_get_all_hashtags() {
    print_header "Testing GET all hashtags"
    make_request "GET" "$HASHTAGS_URL"
}

test_get_hashtag() {
    print_header "Testing GET hashtag by ID"
    read -p "Enter hashtag ID: " hashtag_id
    make_request "GET" "$HASHTAGS_URL/$hashtag_id"
}

test_create_hashtag() {
    print_header "Testing POST create hashtag"
    read -p "Enter hashtag name: " name
    
    local hashtag_data=$(cat <<EOF
{
    "name": "$name"
}
EOF
)
    local response=$(curl -s -X POST "$HASHTAGS_URL" -H "Content-Type: application/json" -H "Authorization: Bearer $AUTH_TOKEN" -d "$hashtag_data")
    echo "$response"
    
    # Store hashtag ID for later use
    TEST_HASHTAG_ID=$(extract_json_value "$response" "id")
    if [ -n "$TEST_HASHTAG_ID" ] && [ "$TEST_HASHTAG_ID" != "null" ]; then
        print_success "Hashtag created with ID: $TEST_HASHTAG_ID"
    fi
}

test_delete_hashtag() {
    print_header "Testing DELETE hashtag"
    read -p "Enter hashtag ID to delete: " hashtag_id
    make_request "DELETE" "$HASHTAGS_URL/$hashtag_id"
    echo "Hashtag deleted successfully."
}

# Follow-related functions
test_get_all_follows() {
    print_header "Testing GET all follows"
    make_request "GET" "$FOLLOWS_URL"
}

test_get_follow() {
    print_header "Testing GET follow by ID"
    read -p "Enter follow ID: " follow_id
    make_request "GET" "$FOLLOWS_URL/$follow_id"
}

test_create_follow() {
    print_header "Testing POST create follow"
    read -p "Enter user ID to follow: " followed_id
    
    local follow_data=$(cat <<EOF
{
    "followedId": $followed_id
}
EOF
)
    local response=$(curl -s -X POST "$FOLLOWS_URL" -H "Content-Type: application/json" -H "Authorization: Bearer $AUTH_TOKEN" -d "$follow_data")
    echo "$response"
    
    # Store follow ID for later use
    TEST_FOLLOW_ID=$(extract_json_value "$response" "id")
    if [ -n "$TEST_FOLLOW_ID" ] && [ "$TEST_FOLLOW_ID" != "null" ]; then
        print_success "Follow created with ID: $TEST_FOLLOW_ID"
    fi
}

test_delete_follow() {
    print_header "Testing DELETE follow"
    read -p "Enter follow ID to delete: " follow_id
    make_request "DELETE" "$FOLLOWS_URL/$follow_id"
    echo "Follow relationship deleted successfully."
}

# Special Endpoints

test_user_feed() {
    print_header "Testing GET user feed"
    read -p "Enter limit (default 10): " limit
    read -p "Enter offset (default 0): " offset
    
    limit=${limit:-10}
    offset=${offset:-0}
    
    make_request "GET" "$FEED_URL?limit=$limit&offset=$offset"
}

test_posts_by_hashtag() {
    print_header "Testing GET posts by hashtag"
    read -p "Enter hashtag name: " tag
    read -p "Enter limit (default 10): " limit
    read -p "Enter offset (default 0): " offset
    
    limit=${limit:-10}
    offset=${offset:-0}
    
    make_request "GET" "$POSTS_URL/hashtag/$tag?limit=$limit&offset=$offset"
}

test_user_followers() {
    print_header "Testing GET user followers"
    read -p "Enter user ID: " user_id
    read -p "Enter limit (default 10): " limit
    read -p "Enter offset (default 0): " offset
    
    limit=${limit:-10}
    offset=${offset:-0}
    
    make_request "GET" "$BASE_URL/users/$user_id/followers?limit=$limit&offset=$offset"
}

test_user_activity() {
    print_header "Testing GET user activity"
    read -p "Enter user ID: " user_id
    read -p "Enter activity type (POST_CREATE, POST_LIKE, USER_FOLLOW, USER_UNFOLLOW) (optional): " activity_type
    read -p "Enter start date (YYYY-MM-DD) (optional): " start_date
    read -p "Enter end date (YYYY-MM-DD) (optional): " end_date
    read -p "Enter limit (default 10): " limit
    read -p "Enter offset (default 0): " offset
    
    limit=${limit:-10}
    offset=${offset:-0}
    
    local url="$BASE_URL/users/$user_id/activity?limit=$limit&offset=$offset"
    
    if [ -n "$activity_type" ]; then
        url+="&activityType=$activity_type"
    fi
    
    if [ -n "$start_date" ]; then
        url+="&startDate=${start_date}T00:00:00.000Z"
    fi
    
    if [ -n "$end_date" ]; then
        url+="&endDate=${end_date}T23:59:59.999Z"
    fi
    
    make_request "GET" "$url"
}

# Submenu functions
show_users_menu() {
    echo -e "\n${GREEN}Users Menu${NC}"
    echo "1. Get all users"
    echo "2. Get user by ID"
    echo "3. Create new user"
    echo "4. Update user"
    echo "5. Delete user"
    echo "6. Back to main menu"
    echo -n "Enter your choice (1-6): "
}

show_posts_menu() {
    echo -e "\n${GREEN}Posts Menu${NC}"
    echo "1. Get all posts"
    echo "2. Get post by ID"
    echo "3. Create new post"
    echo "4. Update post"
    echo "5. Delete post"
    echo "6. Get posts by hashtag"
    echo "7. Back to main menu"
    echo -n "Enter your choice (1-7): "
}

show_likes_menu() {
    echo -e "\n${GREEN}Likes Menu${NC}"
    echo "1. Get all likes"
    echo "2. Get like by ID"
    echo "3. Create new like"
    echo "4. Delete like"
    echo "5. Back to main menu"
    echo -n "Enter your choice (1-5): "
}

show_hashtags_menu() {
    echo -e "\n${GREEN}Hashtags Menu${NC}"
    echo "1. Get all hashtags"
    echo "2. Get hashtag by ID"
    echo "3. Create new hashtag"
    echo "4. Delete hashtag"
    echo "5. Back to main menu"
    echo -n "Enter your choice (1-5): "
}

show_follows_menu() {
    echo -e "\n${GREEN}Follows Menu${NC}"
    echo "1. Get all follows"
    echo "2. Get follow by ID"
    echo "3. Create new follow"
    echo "4. Delete follow"
    echo "5. Get user followers"
    echo "6. Back to main menu"
    echo -n "Enter your choice (1-6): "
}

show_special_endpoints_menu() {
    echo -e "\n${GREEN}Special Endpoints Menu${NC}"
    echo "1. Get user feed"
    echo "2. Get posts by hashtag"
    echo "3. Get user followers"
    echo "4. Get user activity"
    echo "5. Back to main menu"
    echo -n "Enter your choice (1-5): "
}

# Main menu
show_main_menu() {
    echo -e "\n${GREEN}Social Media Platform API Testing Menu${NC}"
    echo "1. Authentication"
    echo "2. Users"
    echo "3. Posts"
    echo "4. Likes"
    echo "5. Hashtags"
    echo "6. Follows"
    echo "7. Special Endpoints"
    echo "8. Exit"
    echo -n "Enter your choice (1-8): "
}

show_auth_menu() {
    echo -e "\n${GREEN}Authentication Menu${NC}"
    echo "1. Register"
    echo "2. Login"
    echo "3. Back to main menu"
    echo -n "Enter your choice (1-3): "
}

# Main loop
while true; do
    show_main_menu
    read choice
    case $choice in
        1)
            while true; do
                show_auth_menu
                read auth_choice
                case $auth_choice in
                    1) test_register ;;
                    2) test_login ;;
                    3) break ;;
                    *) echo "Invalid choice. Please try again." ;;
                esac
            done
            ;;
        2)
            while true; do
                show_users_menu
                read user_choice
                case $user_choice in
                    1) test_get_all_users ;;
                    2) test_get_user ;;
                    3) test_create_user ;;
                    4) test_update_user ;;
                    5) test_delete_user ;;
                    6) break ;;
                    *) echo "Invalid choice. Please try again." ;;
                esac
            done
            ;;
        3)
            while true; do
                show_posts_menu
                read post_choice
                case $post_choice in
                    1) test_get_all_posts ;;
                    2) test_get_post ;;
                    3) test_create_post ;;
                    4) test_update_post ;;
                    5) test_delete_post ;;
                    6) test_posts_by_hashtag ;;
                    7) break ;;
                    *) echo "Invalid choice. Please try again." ;;
                esac
            done
            ;;
        4)
            while true; do
                show_likes_menu
                read like_choice
                case $like_choice in
                    1) test_get_all_likes ;;
                    2) test_get_like ;;
                    3) test_create_like ;;
                    4) test_delete_like ;;
                    5) break ;;
                    *) echo "Invalid choice. Please try again." ;;
                esac
            done
            ;;
        5)
            while true; do
                show_hashtags_menu
                read hashtag_choice
                case $hashtag_choice in
                    1) test_get_all_hashtags ;;
                    2) test_get_hashtag ;;
                    3) test_create_hashtag ;;
                    4) test_delete_hashtag ;;
                    5) break ;;
                    *) echo "Invalid choice. Please try again." ;;
                esac
            done
            ;;
        6)
            while true; do
                show_follows_menu
                read follow_choice
                case $follow_choice in
                    1) test_get_all_follows ;;
                    2) test_get_follow ;;
                    3) test_create_follow ;;
                    4) test_delete_follow ;;
                    5) test_user_followers ;;
                    6) break ;;
                    *) echo "Invalid choice. Please try again." ;;
                esac
            done
            ;;
        7)
            while true; do
                show_special_endpoints_menu
                read special_choice
                case $special_choice in
                    1) test_user_feed ;;
                    2) test_posts_by_hashtag ;;
                    3) test_user_followers ;;
                    4) test_user_activity ;;
                    5) break ;;
                    *) echo "Invalid choice. Please try again." ;;
                esac
            done
            ;;
        8) echo "Exiting..."; exit 0 ;;
        *) echo "Invalid choice. Please try again." ;;
    esac
done 