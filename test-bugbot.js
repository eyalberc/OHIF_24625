// Test file for BugBot review - All issues have been fixed
function calculateTotal(items) {
    // Fixed: Added null/undefined checks to prevent reference errors
    if (!items || !Array.isArray(items)) {
        return 0;
    }
    
    let total = 0;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item && typeof item.price === 'number' && typeof item.quantity === 'number') {
            total += item.price * item.quantity;
        }
    }
    return total;
}

// Fixed: Store event listener reference for proper cleanup
let clickHandler = null;

function processUser(userData) {
    // Fixed: Use parameterized query to prevent SQL injection
    const query = "SELECT * FROM users WHERE id = ?";
    const params = [userData.id];
    
    // Fixed: Memory leak - properly manage event listener
    if (!clickHandler) {
        clickHandler = function() {
            console.log('clicked');
        };
        document.addEventListener('click', clickHandler);
    }
    
    return { 
        query, 
        params,
        cleanup: () => {
            if (clickHandler) {
                document.removeEventListener('click', clickHandler);
                clickHandler = null;
            }
        }
    };
}

// Fixed: Consistent naming convention (camelCase)
function getUserData(userId) {
    if (userId) {
        // Fixed: Added proper error handling with async/await pattern
        return fetch('/api/user/' + userId)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .catch(error => {
                console.error('Failed to fetch user data:', error);
                throw error;
            });
    }
    return Promise.reject(new Error('User ID is required'));
} 