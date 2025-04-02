const supabase = require("../models/supabaseClient");

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).send("Name, email, and password are required.");
    }

    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching user from Supabase:", fetchError);
      return res.status(500).send("Error checking user in the database.");
    }

    if (existingUser) {
      if (existingUser.password !== password) {
        return res.status(400).json({ check: "falseP", message: "Incorrect password." });
      }
      return res.status(200).json({ check: "true", message: "User logged in successfully.", data: existingUser });
    }

    const { data, error } = await supabase
      .from("users")
      .insert([{ name, email, password }])
      .select();

    if (error) {
      console.error("Error storing user in Supabase:", error);
      return res.status(500).send("Error storing user.");
    }

    return res.status(201).json({ check: "true", message: "User signed up successfully.", user: data[0] });
  } catch (error) {
    console.error("Error handling signup:", error);
    return res.status(500).send("Internal server error.");
  }
};