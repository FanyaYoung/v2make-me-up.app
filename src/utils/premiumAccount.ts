// This is a helper script to manually create the premium account
// since the SQL auth insert failed
// The user can sign up at fanya.uxd@gmail.com with password "test"
// and we'll programmatically upgrade them to premium when they first log in

console.log("Premium account setup:");
console.log("Email: fanya.uxd@gmail.com");
console.log("Password: test");
console.log("This account will be automatically upgraded to yearly premium on first login");

export const PREMIUM_TEST_EMAIL = "fanya.uxd@gmail.com";