export const loginUser = async (username: string, password: string) => {
  try {
    const response = await fetch("http://localhost:8000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || "Invalid credentials");
    }

    return await response.json();
  } catch (error) {
    throw new Error("Something went wrong during login.");
  }
};
