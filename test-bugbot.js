// Test file for BugBot review - contains intentional issues
function calculateTotal(items) {
    let total = 0;
    for (let i = 0; i < items.length; i++) {
        // Potential null reference error
        total += items[i].price * items[i].quantity;
    }
    // Missing return statement
}

function processUser(userData) {
    // SQL injection vulnerability
    const query = "SELECT * FROM users WHERE id = " + userData.id;
    
    // Unused variable
    const unusedVar = "test";
    
    // Memory leak - event listener not removed
    document.addEventListener('click', function() {
        console.log('clicked');
    });
    
    return query;
}

// Inconsistent naming convention
function get_user_Data(userId) {
    if (userId) {
        // Missing error handling
        return fetch('/api/user/' + userId);
    }
} 