"use client";

import { useEffect, useState } from "react";

type UserType = "SUPERADMIN" | "ADMIN" | "MANAGER" | "EXECUTIVE";

interface LoginResponse {
  access_token: string;
}

interface UserData {
  id: number;
  username: string;
  fullName: string;
  userType: UserType;
  departmentId?: number | null;
  addressBookId?: number | null;
  department?: {
    id: number;
    departmentName: string;
  } | null;
}

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [fullName, setFullName] = useState<string>("User");
  const [userData, setUserData] = useState<UserData | null>(null);

  // Add this function to get full user data
  const getUserProfile = async (userId: number, token: string): Promise<UserData | null> => {
    try {
      // Try different endpoints that might return department info
      const endpoints = [
        `http://localhost:8000/auth/users/${userId}`,
        `http://localhost:8000/user/${userId}`,
        `http://localhost:8000/users/${userId}`,
        `http://localhost:8000/auth/user/${userId}`
      ];

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.ok) {
            const userProfile = await res.json();
            console.log(`✅ Found user profile at ${endpoint}:`, userProfile);
            return userProfile;
          }
        } catch (err) {
          console.log(`❌ Endpoint ${endpoint} failed:`, err);
          continue;
        }
      }

      // If no specific endpoint works, try to find user in users list with department info
      const usersRes = await fetch("http://localhost:8000/auth/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (usersRes.ok) {
        const users = await usersRes.json();
        const user = users.find((u: any) => Number(u.id) === userId);
        if (user && (user.departmentId || user.department)) {
          console.log("✅ Found user with department in users list:", user);
          return user;
        }
      }

      console.warn("❌ Could not find user profile with department info");
      return null;
    } catch (err) {
      console.error("Error fetching user profile:", err);
      return null;
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // 1️⃣ Login
      const res = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const msg = await res.json();
        setError(msg.message || "Invalid credentials");
        setLoading(false);
        return false;
      }

      const data: LoginResponse = await res.json();
      const token = data.access_token;

      // Save token
      localStorage.setItem("access_token", token);

      // 2️⃣ Fetch users list to find the user
      const usersRes = await fetch("http://localhost:8000/auth/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const users = await usersRes.json();

      // 3️⃣ Find logged user
      const found = users.find((u: any) => u.username === username);

      if (!found) {
        setError("User not found in the system");
        return false;
      }

      // 4️⃣ Fetch full user profile with department info
      const userProfile = await getUserProfile(found.id, token);
      
      // Prepare user data to store
      const userDataToStore: UserData = {
        id: found.id,
        username: found.username,
        fullName: found.fullName,
        userType: found.userType,
        departmentId: userProfile?.departmentId || userProfile?.department?.id || null,
        addressBookId: userProfile?.addressBookId || null,
        department: userProfile?.department || null
      };

      console.log("📦 User data to store:", userDataToStore);

      // 5️⃣ Store in localStorage
      localStorage.setItem("userId", String(found.id));
      localStorage.setItem("fullName", found.fullName);
      localStorage.setItem("userType", found.userType);
      localStorage.setItem("departmentId", String(userDataToStore.departmentId || ""));
      localStorage.setItem("departmentName", userDataToStore.department?.departmentName || "");
      localStorage.setItem("userData", JSON.stringify(userDataToStore));

      // 6️⃣ set state for UI
      setUserId(found.id);
      setUserType(found.userType);
      setFullName(found.fullName);
      setUserData(userDataToStore);

      return true;
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Add a function to check if user is logged in on page load
  const checkAuthStatus = () => {
    const storedUserId = localStorage.getItem("userId");
    const storedUserType = localStorage.getItem("userType") as UserType | null;
    const storedFullName = localStorage.getItem("fullName");
    const storedUserData = localStorage.getItem("userData");

    if (storedUserId && storedUserType && storedFullName) {
      setUserId(Number(storedUserId));
      setUserType(storedUserType);
      setFullName(storedFullName);
      
      if (storedUserData) {
        try {
          setUserData(JSON.parse(storedUserData));
        } catch (e) {
          console.error("Error parsing stored user data:", e);
        }
      }
    }
  };

  // Add logout function
  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("userId");
    localStorage.removeItem("fullName");
    localStorage.removeItem("userType");
    localStorage.removeItem("departmentId");
    localStorage.removeItem("departmentName");
    localStorage.removeItem("userData");
    
    setUserId(null);
    setUserType(null);
    setFullName("User");
    setUserData(null);
  };

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  return { 
    login, 
    logout,
    loading, 
    error, 
    userId, 
    userType, 
    fullName,
    userData,
    checkAuthStatus
  };
};