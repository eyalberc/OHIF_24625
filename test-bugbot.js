// Test file for BugBot review - contains intentional issues
function calculateTotal(items) {
    let total = 0;
    for (let i = 0; i < items.length; i++) {
        // Potential null reference error
        total += items[i].price * items[i].quantity;
    }
    // Fixed: Added missing return statement
    return total;
}

function processUser(userData) {
    // Fixed: Use parameterized query to prevent SQL injection
    const query = "SELECT * FROM users WHERE id = ?";
    const params = [userData.id];
    
    // Unused variable
    const unusedVar = "test";
    
    // Memory leak - event listener not removed
    document.addEventListener('click', function() {
        console.log('clicked');
    });
    
    return { query, params };
}

// Inconsistent naming convention
function get_user_Data(userId) {
    if (userId) {
        // Missing error handling
        return fetch('/api/user/' + userId);
    }
} 