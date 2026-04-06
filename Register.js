const supabase = supabase.createClient(
  "https://hudcypsorcmarkknamre.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1ZGN5cHNvcmNtYXJra25hbXJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0ODkxMzYsImV4cCI6MjA5MTA2NTEzNn0.5S3gs7u5JI6nbh8y13VK0b4E-rxCBFdaDj1dlExVLT0"
);

async function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    alert(error.message);
  } else {
    alert("Check your email to confirm account");
    window.location.href = "index.html";
  }
}
