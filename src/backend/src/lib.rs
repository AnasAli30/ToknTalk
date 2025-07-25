use candid::{CandidType, Deserialize, Principal};
use ic_cdk::api::time;
use ic_cdk::{query, update};
use std::cell::RefCell;
use std::collections::HashMap;
use std::collections::BTreeMap;


// Data structures
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Todo {
    pub id: u64,
    pub content: String,
    pub completed: bool,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum PostType {
    Original,
    Reshare { original_post_id: u64, original_author: Principal }
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Post {
    pub id: u64,
    pub author: Principal,
    pub content: String,
    pub created_at: u64,
    pub likes: Vec<Principal>,
    pub comments: Vec<u64>,
    pub hashtags: Vec<String>,
    pub post_type: PostType,
    pub reshare_count: u64,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Comment {
    pub id: u64,
    pub post_id: u64,
    pub author: Principal,
    pub content: String,
    pub created_at: u64,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct UserProfile {
    pub id: Principal,
    pub username: String,
    pub bio: Vec<String>,
    pub avatar_url: Vec<String>,
    pub followers_count: u64,
    pub following_count: u64,
    pub created_at: u64,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum NotificationType {
    Follow { user_id: Principal },
    Like { post_id: u64, user_id: Principal },
    Comment { post_id: u64, user_id: Principal, comment_id: u64 },
    Message { user_id: Principal, message_id: u64 },
    Mention { post_id: u64, user_id: Principal },
    Reshare { post_id: u64, user_id: Principal },
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Notification {
    pub id: u64,
    pub recipient: Principal,
    pub notification_type: NotificationType,
    pub created_at: u64,
    pub read: bool,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Message {
    pub id: u64,
    pub from: Principal,
    pub to: Principal,
    pub content: String,
    pub created_at: u64,
    pub read: bool,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct ChatThread {
    pub id: String,
    pub participants: Vec<Principal>,
    pub last_message: Option<Message>,
    pub updated_at: u64,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct TrendingTopic {
    pub hashtag: String,
    pub count: u64,
    pub last_used: u64,
}

// Wallet structures
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Wallet {
    pub owner: Principal,
    pub balance: u64,
    pub transactions: Vec<Transaction>,
    pub created_at: u64,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Transaction {
    pub id: u64,
    pub from: Principal,
    pub to: Principal,
    pub amount: u64,
    pub transaction_type: TransactionType,
    pub timestamp: u64,
    pub status: TransactionStatus,
    pub memo: Option<String>,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum TransactionType {
    Transfer,
    Tip,
    Reward,
    Purchase,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum TransactionStatus {
    Pending,
    Completed,
    Failed,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct TransferRequest {
    pub to: Principal,
    pub amount: u64,
    pub memo: Option<String>,
}

// Result types
#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum Result<T, E> {
    Ok(T),
    Err(E),
}

// Thread-local storage
thread_local! {
    static TODOS: RefCell<Vec<Todo>> = RefCell::new(Vec::new());
    static POSTS: RefCell<HashMap<u64, Post>> = RefCell::new(HashMap::new());
    static COMMENTS: RefCell<HashMap<u64, Comment>> = RefCell::new(HashMap::new());
    static PROFILES: RefCell<HashMap<Principal, UserProfile>> = RefCell::new(HashMap::new());
    static FOLLOWS: RefCell<HashMap<Principal, Vec<Principal>>> = RefCell::new(HashMap::new());
    static NOTIFICATIONS: RefCell<HashMap<u64, Notification>> = RefCell::new(HashMap::new());
    static MESSAGES: RefCell<HashMap<u64, Message>> = RefCell::new(HashMap::new());
    static CHAT_THREADS: RefCell<HashMap<String, ChatThread>> = RefCell::new(HashMap::new());
    static TRENDING_TOPICS: RefCell<HashMap<String, TrendingTopic>> = RefCell::new(HashMap::new());
    static COUNTER: RefCell<u64> = RefCell::new(0);
    static POST_COUNTER: RefCell<u64> = RefCell::new(0);
    static COMMENT_COUNTER: RefCell<u64> = RefCell::new(0);
    static NOTIFICATION_COUNTER: RefCell<u64> = RefCell::new(0);
    static MESSAGE_COUNTER: RefCell<u64> = RefCell::new(0);
    static INTERACTION_GRAPH: RefCell<HashMap<Principal, HashMap<Principal, u64>>> = RefCell::new(HashMap::new());
    static CONTENT_AFFINITY: RefCell<HashMap<Principal, HashMap<String, u64>>> = RefCell::new(HashMap::new());
}

// Helper functions
fn get_next_id(counter: &'static std::thread::LocalKey<std::cell::RefCell<u64>>) -> u64 {
    counter.with(|c| {
        let mut id = c.borrow_mut();
        *id += 1;
        *id
    })
}

fn update_interaction_graph(from_user: Principal, to_user: Principal, weight: u64) {
    INTERACTION_GRAPH.with(|graph| {
        let mut graph = graph.borrow_mut();
        let user_interactions = graph.entry(from_user).or_insert_with(HashMap::new);
        *user_interactions.entry(to_user).or_insert(0) += weight;
    });
}

fn update_content_affinity(user: Principal, hashtags: &Vec<String>, weight: u64) {
    CONTENT_AFFINITY.with(|affinity| {
        let mut affinity = affinity.borrow_mut();
        let user_affinity = affinity.entry(user).or_insert_with(HashMap::new);
        for hashtag in hashtags {
            *user_affinity.entry(hashtag.clone()).or_insert(0) += weight;
        }
    });
}

fn update_trending_topics(hashtags: &Vec<String>) {
    let current_time = time();
    TRENDING_TOPICS.with(|topics| {
        let mut topics = topics.borrow_mut();
        for hashtag in hashtags {
            let topic = topics.entry(hashtag.clone()).or_insert_with(|| TrendingTopic {
                hashtag: hashtag.clone(),
                count: 0,
                last_used: current_time,
            });
            topic.count += 1;
            topic.last_used = current_time;
        }
    });
}

// Helper function to create posts (used by both create_post and reshare_post)
fn create_post_internal(author: Principal, content: String, post_type: PostType) -> Result<Post, String> {
    let post_id = get_next_id(&POST_COUNTER);
    let hashtags: Vec<String> = content
        .split_whitespace()
        .filter(|word| word.starts_with('#'))
        .map(|word| word.to_string())
        .collect();

    let post = Post {
        id: post_id,
        author,
        content,
        created_at: time(),
        likes: Vec::new(),
        comments: Vec::new(),
        hashtags: hashtags.clone(),
        post_type,
        reshare_count: 0,
    };

    POSTS.with(|posts| {
        posts.borrow_mut().insert(post_id, post.clone());
    });

    update_trending_topics(&hashtags);
    update_content_affinity(author, &hashtags, 1);

    Result::Ok(post)
}

// Basic functions
#[query]
fn greet(name: String) -> String {
    format!("Hello, {}! Welcome to ToknTalk!", name)
}

#[query]
fn get_counter() -> u64 {
    COUNTER.with(|counter| *counter.borrow())
}

#[update]
fn increment_counter() -> u64 {
    COUNTER.with(|counter| {
        let val = *counter.borrow() + 1;
        *counter.borrow_mut() = val;
        val
    })
}

#[update]
fn set_counter(value: u64) -> u64 {
    COUNTER.with(|counter| {
        *counter.borrow_mut() = value;
        value
    })
}

// LLM functions
#[update]
async fn llm_prompt(prompt_str: String) -> String {
    // Placeholder for LLM functionality
    format!("AI Response to: {}", prompt_str)
}

// Todo functions
#[update]
fn add_todo(text: String) -> Todo {
    let id = get_next_id(&COUNTER);
    let todo = Todo {
        id,
        content: text,
        completed: false,
    };
    TODOS.with(|todos| {
        todos.borrow_mut().push(todo.clone());
    });
    todo
}

#[query]
fn get_todos() -> Vec<Todo> {
    TODOS.with(|todos| todos.borrow().clone())
}

#[update]
fn toggle_todo(id: u64) -> Option<Todo> {
    TODOS.with(|todos| {
        let mut todos = todos.borrow_mut();
        if let Some(todo) = todos.iter_mut().find(|t| t.id == id) {
            todo.completed = !todo.completed;
            Some(todo.clone())
        } else {
            None
        }
    })
}

#[update]
fn delete_todo(id: u64) -> bool {
    TODOS.with(|todos| {
        let mut todos = todos.borrow_mut();
        let initial_len = todos.len();
        todos.retain(|todo| todo.id != id);
        todos.len() < initial_len
    })
}

// Profile functions
#[update]
fn create_profile(username: String, bio: Vec<String>, avatar_url: Vec<String>) -> Result<UserProfile, String> {
    let caller = ic_cdk::caller();
    
    if PROFILES.with(|profiles| profiles.borrow().contains_key(&caller)) {
        return Result::Err("Profile already exists".to_string());
    }

    let profile = UserProfile {
        id: caller,
        username,
        bio,
        avatar_url,
        followers_count: 0,
        following_count: 0,
        created_at: time(),
    };

    PROFILES.with(|profiles| {
        profiles.borrow_mut().insert(caller, profile.clone());
    });

    Result::Ok(profile)
}

#[update]
fn update_profile(bio: Option<Vec<String>>, avatar_url: Option<Vec<String>>) -> Result<UserProfile, String> {
    let caller = ic_cdk::caller();
    
    PROFILES.with(|profiles| {
        let mut profiles = profiles.borrow_mut();
        if let Some(profile) = profiles.get_mut(&caller) {
            if let Some(bio) = bio {
                profile.bio = bio;
            }
            if let Some(avatar_url) = avatar_url {
                profile.avatar_url = avatar_url;
            }
            Result::Ok(profile.clone())
        } else {
            Result::Err("Profile not found".to_string())
        }
    })
}

#[query]
fn get_profile() -> Result<UserProfile, String> {
    let caller = ic_cdk::caller();
    PROFILES.with(|profiles| {
        profiles.borrow().get(&caller).cloned().map(Result::Ok).unwrap_or(Result::Err("Profile not found".to_string()))
    })
}

#[query]
fn get_user_profile(user_id: Principal) -> Result<UserProfile, String> {
    PROFILES.with(|profiles| {
        profiles.borrow().get(&user_id).cloned().map(Result::Ok).unwrap_or(Result::Err("Profile not found".to_string()))
    })
}

// Post functions
#[update]
fn create_post(content: String) -> Result<Post, String> {
    let author = ic_cdk::caller();
    create_post_internal(author, content, PostType::Original)
}

#[update]
fn reshare_post(post_id: u64) -> Result<Post, String> {
    let author = ic_cdk::caller();
    
    // Get the original post
    let original_post = match POSTS.with(|posts| {
        posts.borrow().get(&post_id).cloned()
    }) {
        Some(post) => post,
        None => return Result::Err("Original post not found".to_string()),
    };

    // Create reshare post
    let reshare_content = format!("Reshared: {}", original_post.content);
    let post_type = PostType::Reshare {
        original_post_id: post_id,
        original_author: original_post.author,
    };

    let reshare_post = match create_post_internal(author, reshare_content, post_type) {
        Result::Ok(post) => post,
        Result::Err(e) => return Result::Err(e),
    };

    // Update original post's reshare count
    POSTS.with(|posts| {
        if let Some(post) = posts.borrow_mut().get_mut(&post_id) {
            post.reshare_count += 1;
        }
    });

    // Create notification
    let notification_id = get_next_id(&NOTIFICATION_COUNTER);
    let notification = Notification {
        id: notification_id,
        recipient: original_post.author,
        notification_type: NotificationType::Reshare { post_id, user_id: author },
        created_at: time(),
        read: false,
    };
    NOTIFICATIONS.with(|notifications| {
        notifications.borrow_mut().insert(notification_id, notification);
    });

    Result::Ok(reshare_post)
}

#[query]
fn get_original_post(post_id: u64) -> Result<Post, String> {
    POSTS.with(|posts| {
        posts.borrow().get(&post_id).cloned().map(Result::Ok).unwrap_or(Result::Err("Post not found".to_string()))
    })
}

#[query]
fn get_feed(limit: u64) -> Vec<Post> {
    POSTS.with(|posts| {
        let mut posts_vec: Vec<Post> = posts.borrow().values().cloned().collect();
        posts_vec.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        posts_vec.truncate(limit as usize);
        posts_vec
    })
}

#[query]
fn get_personalized_feed(limit: u64) -> Vec<Post> {
    let caller = ic_cdk::caller();
    let mut scored_posts: Vec<(Post, u64)> = Vec::new();

    POSTS.with(|posts| {
        for post in posts.borrow().values() {
            let mut score = 0u64;
            
            // Score based on follows
            if FOLLOWS.with(|follows| {
                follows.borrow().get(&caller).map_or(false, |following| following.contains(&post.author))
            }) {
                score += 10;
            }

            // Score based on content affinity
            CONTENT_AFFINITY.with(|affinity| {
                if let Some(user_affinity) = affinity.borrow().get(&caller) {
                    for hashtag in &post.hashtags {
                        if let Some(hashtag_score) = user_affinity.get(hashtag) {
                            score += hashtag_score;
                        }
                    }
                }
            });

            // Score based on interaction graph
            INTERACTION_GRAPH.with(|graph| {
                if let Some(interactions) = graph.borrow().get(&caller) {
                    if let Some(strength) = interactions.get(&post.author) {
                        score += strength;
                    }
                }
            });

            scored_posts.push((post.clone(), score));
        }
    });

    scored_posts.sort_by(|a, b| b.1.cmp(&a.1));
    scored_posts.truncate(limit as usize);
    scored_posts.into_iter().map(|(post, _)| post).collect()
}

// Like/Unlike functions
#[update]
fn like_post(post_id: u64) -> Result<Post, String> {
    let user = ic_cdk::caller();
    
    POSTS.with(|posts| {
        let mut posts = posts.borrow_mut();
        if let Some(post) = posts.get_mut(&post_id) {
            if !post.likes.contains(&user) {
                post.likes.push(user);
                
                // Create notification
                let notification_id = get_next_id(&NOTIFICATION_COUNTER);
                let notification = Notification {
                    id: notification_id,
                    recipient: post.author,
                    notification_type: NotificationType::Like { post_id, user_id: user },
                    created_at: time(),
                    read: false,
                };
                NOTIFICATIONS.with(|notifications| {
                    notifications.borrow_mut().insert(notification_id, notification);
                });

                // Update interaction graph
                update_interaction_graph(user, post.author, 1);
                
                Result::Ok(post.clone())
            } else {
                Result::Err("Post already liked".to_string())
            }
        } else {
            Result::Err("Post not found".to_string())
        }
    })
}

#[update]
fn unlike_post(post_id: u64) -> Result<Post, String> {
    let user = ic_cdk::caller();
    
    POSTS.with(|posts| {
        let mut posts = posts.borrow_mut();
        if let Some(post) = posts.get_mut(&post_id) {
            if let Some(pos) = post.likes.iter().position(|&x| x == user) {
                post.likes.remove(pos);
                Result::Ok(post.clone())
            } else {
                Result::Err("Post not liked".to_string())
            }
        } else {
            Result::Err("Post not found".to_string())
        }
    })
}

// Comment functions
#[update]
fn add_comment(post_id: u64, content: String) -> Result<Comment, String> {
    let author = ic_cdk::caller();
    let comment_id = get_next_id(&COMMENT_COUNTER);
    
    let comment = Comment {
        id: comment_id,
        post_id,
        author,
        content,
        created_at: time(),
    };

    COMMENTS.with(|comments| {
        comments.borrow_mut().insert(comment_id, comment.clone());
    });

    POSTS.with(|posts| {
        let mut posts = posts.borrow_mut();
        if let Some(post) = posts.get_mut(&post_id) {
            post.comments.push(comment_id);
            
            // Create notification
            let notification_id = get_next_id(&NOTIFICATION_COUNTER);
            let notification = Notification {
                id: notification_id,
                recipient: post.author,
                notification_type: NotificationType::Comment { post_id, user_id: author, comment_id },
                created_at: time(),
                read: false,
            };
            NOTIFICATIONS.with(|notifications| {
                notifications.borrow_mut().insert(notification_id, notification);
            });

            // Update interaction graph
            update_interaction_graph(author, post.author, 2);
        }
    });

    Result::Ok(comment)
}

#[query]
fn get_comments(post_id: u64) -> Vec<Comment> {
    POSTS.with(|posts| {
        if let Some(post) = posts.borrow().get(&post_id) {
            COMMENTS.with(|comments| {
                post.comments.iter()
                    .filter_map(|&comment_id| comments.borrow().get(&comment_id).cloned())
                    .collect()
            })
        } else {
            Vec::new()
        }
    })
}

// Follow functions
#[update]
fn follow_user(user_id: Principal) -> Result<(), String> {
    let follower = ic_cdk::caller();
    
    if follower == user_id {
        return Result::Err("Cannot follow yourself".to_string());
    }

    FOLLOWS.with(|follows| {
        let mut follows = follows.borrow_mut();
        let following = follows.entry(follower).or_insert_with(Vec::new);
        if !following.contains(&user_id) {
            following.push(user_id);
            
            // Update profile counts
            PROFILES.with(|profiles| {
                let mut profiles = profiles.borrow_mut();
                if let Some(profile) = profiles.get_mut(&follower) {
                    profile.following_count += 1;
                }
                if let Some(profile) = profiles.get_mut(&user_id) {
                    profile.followers_count += 1;
                }
            });

            // Create notification
            let notification_id = get_next_id(&NOTIFICATION_COUNTER);
            let notification = Notification {
                id: notification_id,
                recipient: user_id,
                notification_type: NotificationType::Follow { user_id: follower },
                created_at: time(),
                read: false,
            };
            NOTIFICATIONS.with(|notifications| {
                notifications.borrow_mut().insert(notification_id, notification);
            });

            // Update interaction graph
            update_interaction_graph(follower, user_id, 5);
            
            Result::Ok(())
        } else {
            Result::Err("Already following".to_string())
        }
    })
}

#[update]
fn unfollow_user(user_id: Principal) -> Result<(), String> {
    let follower = ic_cdk::caller();
    
    FOLLOWS.with(|follows| {
        let mut follows = follows.borrow_mut();
        if let Some(following) = follows.get_mut(&follower) {
            if let Some(pos) = following.iter().position(|&x| x == user_id) {
                following.remove(pos);
                
                // Update profile counts
                PROFILES.with(|profiles| {
                    let mut profiles = profiles.borrow_mut();
                    if let Some(profile) = profiles.get_mut(&follower) {
                        profile.following_count = profile.following_count.saturating_sub(1);
                    }
                    if let Some(profile) = profiles.get_mut(&user_id) {
                        profile.followers_count = profile.followers_count.saturating_sub(1);
                    }
                });
                
                Result::Ok(())
            } else {
                Result::Err("Not following".to_string())
            }
        } else {
            Result::Err("Not following".to_string())
        }
    })
}

#[query]
fn get_followers(user_id: Principal) -> Vec<Principal> {
    FOLLOWS.with(|follows| {
        follows.borrow().iter()
            .filter_map(|(follower, following)| {
                if following.contains(&user_id) {
                    Some(*follower)
                } else {
                    None
                }
            })
            .collect()
    })
}

#[query]
fn get_following(user_id: Principal) -> Vec<Principal> {
    FOLLOWS.with(|follows| {
        follows.borrow().get(&user_id).cloned().unwrap_or_default()
    })
}

// Search functions
#[query]
fn search_users(query: String) -> Vec<UserProfile> {
    let query_lower = query.to_lowercase();
    PROFILES.with(|profiles| {
        profiles.borrow().values()
            .filter(|profile| {
                profile.username.to_lowercase().contains(&query_lower) ||
                profile.bio.iter().any(|bio| bio.to_lowercase().contains(&query_lower))
            })
            .cloned()
            .collect()
    })
}

#[query]
fn search_posts_by_hashtag(hashtag: String) -> Vec<Post> {
    POSTS.with(|posts| {
        posts.borrow().values()
            .filter(|post| post.hashtags.contains(&hashtag))
            .cloned()
            .collect()
    })
}

// Notification functions
#[query]
fn get_notifications() -> Vec<Notification> {
    let caller = ic_cdk::caller();
    NOTIFICATIONS.with(|notifications| {
        notifications.borrow().values()
            .filter(|notification| notification.recipient == caller)
            .cloned()
            .collect()
    })
}

#[update]
fn mark_notification_as_read(notification_id: u64) -> Result<(), String> {
    let caller = ic_cdk::caller();
    NOTIFICATIONS.with(|notifications| {
        let mut notifications = notifications.borrow_mut();
        if let Some(notification) = notifications.get_mut(&notification_id) {
            if notification.recipient == caller {
                notification.read = true;
                Result::Ok(())
            } else {
                Result::Err("Not authorized".to_string())
            }
        } else {
            Result::Err("Notification not found".to_string())
        }
    })
}

#[update]
fn mark_all_notifications_as_read() -> Result<(), String> {
    let caller = ic_cdk::caller();
    NOTIFICATIONS.with(|notifications| {
        let mut notifications = notifications.borrow_mut();
        for notification in notifications.values_mut() {
            if notification.recipient == caller {
                notification.read = true;
            }
        }
        Result::Ok(())
    })
}

// Message functions
#[update]
fn send_message(to_user_id: Principal, content: String) -> Result<Message, String> {
    let from_user = ic_cdk::caller();
    
    if from_user == to_user_id {
        return Result::Err("Cannot send message to yourself".to_string());
    }

    let message_id = get_next_id(&MESSAGE_COUNTER);
    let message = Message {
        id: message_id,
        from: from_user,
        to: to_user_id,
        content,
        created_at: time(),
        read: false,
    };

    MESSAGES.with(|messages| {
        messages.borrow_mut().insert(message_id, message.clone());
    });

    // Create or update chat thread
    let thread_id = if from_user < to_user_id {
        format!("{}_{}", from_user, to_user_id)
    } else {
        format!("{}_{}", to_user_id, from_user)
    };

    CHAT_THREADS.with(|threads| {
        let mut threads = threads.borrow_mut();
        let thread = threads.entry(thread_id.clone()).or_insert_with(|| ChatThread {
            id: thread_id,
            participants: vec![from_user, to_user_id],
            last_message: None,
            updated_at: time(),
        });
        thread.last_message = Some(message.clone());
        thread.updated_at = time();
    });

    // Create notification
    let notification_id = get_next_id(&NOTIFICATION_COUNTER);
    let notification = Notification {
        id: notification_id,
        recipient: to_user_id,
        notification_type: NotificationType::Message { user_id: from_user, message_id },
        created_at: time(),
        read: false,
    };
    NOTIFICATIONS.with(|notifications| {
        notifications.borrow_mut().insert(notification_id, notification);
    });

    Result::Ok(message)
}

#[query]
fn get_messages(with_user_id: Principal) -> Vec<Message> {
    let caller = ic_cdk::caller();
    MESSAGES.with(|messages| {
        messages.borrow().values()
            .filter(|message| {
                (message.from == caller && message.to == with_user_id) ||
                (message.from == with_user_id && message.to == caller)
            })
            .cloned()
            .collect()
    })
}

#[query]
fn get_chat_threads() -> Vec<ChatThread> {
    let caller = ic_cdk::caller();
    CHAT_THREADS.with(|threads| {
        threads.borrow().values()
            .filter(|thread| thread.participants.contains(&caller))
            .cloned()
            .collect()
    })
}

#[update]
fn mark_messages_as_read(from_user_id: Principal) -> u64 {
    let caller = ic_cdk::caller();
    let mut count = 0u64;
    
    MESSAGES.with(|messages| {
        let mut messages = messages.borrow_mut();
        for message in messages.values_mut() {
            if message.from == from_user_id && message.to == caller && !message.read {
                message.read = true;
                count += 1;
            }
        }
    });
    
    count
}

// Social graph functions
#[query]
fn get_mutual_connections(user_id: Principal) -> Vec<Principal> {
    let caller = ic_cdk::caller();
    let caller_following = FOLLOWS.with(|follows| {
        follows.borrow().get(&caller).cloned().unwrap_or_default()
    });
    let user_following = FOLLOWS.with(|follows| {
        follows.borrow().get(&user_id).cloned().unwrap_or_default()
    });
    
    caller_following.into_iter()
        .filter(|user| user_following.contains(user))
        .collect()
}

#[query]
fn suggest_connections(limit: u64) -> Vec<UserProfile> {
    let caller = ic_cdk::caller();
    let caller_following = FOLLOWS.with(|follows| {
        follows.borrow().get(&caller).cloned().unwrap_or_default()
    });
    
    let mut suggestions: Vec<(UserProfile, u64)> = Vec::new();
    
    PROFILES.with(|profiles| {
        for profile in profiles.borrow().values() {
            if profile.id != caller && !caller_following.contains(&profile.id) {
                let mut score = 0u64;
                
                // Score based on mutual connections
                let mutual_count = get_mutual_connections(profile.id).len() as u64;
                score += mutual_count * 10;
                
                // Score based on content affinity
                CONTENT_AFFINITY.with(|affinity| {
                    if let Some(caller_affinity) = affinity.borrow().get(&caller) {
                        if let Some(profile_affinity) = affinity.borrow().get(&profile.id) {
                            for (hashtag, caller_score) in caller_affinity {
                                if let Some(profile_score) = profile_affinity.get(hashtag) {
                                    score += caller_score.min(profile_score);
                                }
                            }
                        }
                    }
                });
                
                suggestions.push((profile.clone(), score));
            }
        }
    });
    
    suggestions.sort_by(|a, b| b.1.cmp(&a.1));
    suggestions.truncate(limit as usize);
    suggestions.into_iter().map(|(profile, _)| profile).collect()
}

#[query]
fn get_connection_strength(user_id: Principal) -> u64 {
    let caller = ic_cdk::caller();
    INTERACTION_GRAPH.with(|graph| {
        graph.borrow()
            .get(&caller)
            .and_then(|interactions| interactions.get(&user_id))
            .copied()
            .unwrap_or(0)
    })
}

// Trending topics
#[query]
fn get_trending_topics(limit: u64) -> Vec<TrendingTopic> {
    TRENDING_TOPICS.with(|topics| {
        let mut topics_vec: Vec<TrendingTopic> = topics.borrow().values().cloned().collect();
        topics_vec.sort_by(|a, b| b.count.cmp(&a.count));
        topics_vec.truncate(limit as usize);
        topics_vec
    })
}

// Identity function
#[query]
fn whoami() -> Principal {
    ic_cdk::caller()
}
