import bcrypt from "bcrypt";
import crypto from "crypto";
import { storage } from "../storage";

const samplePhotos = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1418065460487-3956c3bdb925?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=600&fit=crop",
];

const sampleCaptions = [
  "Beautiful sunset over the mountains 🌅",
  "Coffee and coding kind of day ☕",
  "Nature therapy in progress 🌲",
  "Weekend vibes hitting different 🎉",
  "Golden hour magic ✨",
  "Adventure awaits just around the corner 🗺️",
  "Simple moments, big memories 📸",
  "Living my best life one day at a time 💫",
  "Grateful for these peaceful moments 🙏",
  "Chasing dreams and catching sunsets 🌇",
  "Good vibes only today 🌈",
  "Making memories that last forever 💕",
  "Every picture tells a story 📖",
  "Life is beautiful when you pause to notice 🌸",
  "Collecting moments, not things 🎒",
];

const users = [
  {
    firstName: "Emma",
    lastName: "Johnson",
    username: "emma_j",
    email: "emma@example.com",
    bio: "Travel enthusiast & photographer 📸✈️",
    profileImageUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
  },
  {
    firstName: "Alex",
    lastName: "Smith",
    username: "alex_smith",
    email: "alex@example.com",
    bio: "Coffee lover ☕ | Tech geek 💻",
    profileImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
  },
  {
    firstName: "Sarah",
    lastName: "Wilson",
    username: "sarah_w",
    email: "sarah@example.com",
    bio: "Nature lover 🌿 | Yoga instructor 🧘‍♀️",
    profileImageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
  },
  {
    firstName: "Mike",
    lastName: "Brown",
    username: "mike_b",
    email: "mike@example.com",
    bio: "Fitness enthusiast 💪 | Food blogger 🍕",
    profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
  },
  {
    firstName: "Jessica",
    lastName: "Davis",
    username: "jess_d",
    email: "jessica@example.com",
    bio: "Artist 🎨 | Dog mom 🐕",
    profileImageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face"
  },
  {
    firstName: "David",
    lastName: "Miller",
    username: "david_m",
    email: "david@example.com",
    bio: "Musician 🎸 | Adventure seeker 🏔️",
    profileImageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face"
  },
  {
    firstName: "Lisa",
    lastName: "Garcia",
    username: "lisa_g",
    email: "lisa@example.com",
    bio: "Chef 👩‍🍳 | Food photographer 📷",
    profileImageUrl: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face"
  },
  {
    firstName: "Ryan",
    lastName: "Taylor",
    username: "ryan_t",
    email: "ryan@example.com",
    bio: "Surfer 🏄‍♂️ | Beach lover 🏖️",
    profileImageUrl: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&h=150&fit=crop&crop=face"
  },
  {
    firstName: "Nina",
    lastName: "Anderson",
    username: "nina_a",
    email: "nina@example.com",
    bio: "Book lover 📚 | Tea enthusiast 🫖",
    profileImageUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face"
  },
  {
    firstName: "Tom",
    lastName: "White",
    username: "tom_w",
    email: "tom@example.com",
    bio: "Cyclist 🚴‍♂️ | Mountain climber 🏔️",
    profileImageUrl: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=150&h=150&fit=crop&crop=face"
  }
];

export async function seedDatabase() {
  console.log("Starting database seeding...");
  
  try {
    // Hash password for all users
    const hashedPassword = await bcrypt.hash("12345678", 12);
    
    // Create users
    const createdUsers = [];
    for (const userData of users) {
      const user = await storage.upsertUser({
        id: crypto.randomUUID(),
        ...userData,
        password: hashedPassword,
        isPrivate: false,
        followerCount: Math.floor(Math.random() * 500) + 50,
        followingCount: Math.floor(Math.random() * 300) + 30,
        postCount: 0, // Will be updated after creating posts
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      createdUsers.push(user);
    }
    
    console.log(`Created ${createdUsers.length} users`);
    
    // Create posts for each user
    let totalPosts = 0;
    for (const user of createdUsers) {
      const numPosts = Math.floor(Math.random() * 5) + 2; // 2-6 posts per user
      
      for (let i = 0; i < numPosts; i++) {
        const randomPhoto = samplePhotos[Math.floor(Math.random() * samplePhotos.length)];
        const randomCaption = sampleCaptions[Math.floor(Math.random() * sampleCaptions.length)];
        
        await storage.createPost({
          userId: user.id,
          media: [randomPhoto],
          mediaType: "image",
          caption: randomCaption,
          location: null,
        });
        
        totalPosts++;
      }
      
      // Update user's post count
      await storage.upsertUser({
        ...user,
        postCount: numPosts,
        updatedAt: new Date(),
      });
    }
    
    console.log(`Created ${totalPosts} posts`);
    
    // Create some follow relationships
    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      const numFollows = Math.floor(Math.random() * 5) + 2; // Each user follows 2-6 others
      
      for (let j = 0; j < numFollows; j++) {
        const randomIndex = Math.floor(Math.random() * createdUsers.length);
        const userToFollow = createdUsers[randomIndex];
        
        // Don't follow yourself
        if (userToFollow.id !== user.id) {
          try {
            await storage.followUser(user.id, userToFollow.id);
          } catch (error) {
            // Skip if already following (duplicate key error)
            console.log(`Follow relationship already exists: ${user.username} -> ${userToFollow.username}`);
          }
        }
      }
    }
    
    console.log("Database seeding completed successfully!");
    return { users: createdUsers.length, posts: totalPosts };
    
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}