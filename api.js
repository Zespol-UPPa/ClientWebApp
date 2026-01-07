// Central API module for frontend-backend communication
// All requests go through API Gateway (port 8090)

const API_BASE_URL = 'http://localhost:8090';
const API_TIMEOUT = 30000; // 30 seconds

// Token management
function getAuthToken() {
    return localStorage.getItem('authToken');
}

function setAuthToken(token) {
    if (token) {
        localStorage.setItem('authToken', token);
    } else {
        localStorage.removeItem('authToken');
    }
}

function clearAuthToken() {
    localStorage.removeItem('authToken');
    // Also clear HttpOnly cookie by setting it to expire immediately
    // Note: We can't directly delete HttpOnly cookies from JavaScript,
    // but we can set it to expire by making a request to backend logout endpoint
    // For now, we'll rely on backend to clear cookie on next request if token is invalid
}

function isTokenValid() {
    const token = getAuthToken();
    if (!token) {
        if (isDebugMode()) {
            console.debug('[Token Validation] No token found in localStorage');
        }
        return false;
    }
    
    try {
        // Check if token has correct JWT format (3 parts separated by dots)
        const parts = token.split('.');
        if (parts.length !== 3) {
            if (isDebugMode()) {
                console.warn('[Token Validation] Invalid JWT format: expected 3 parts, got', parts.length);
            }
            return false; // Invalid JWT format
        }
        
        // Decode JWT token (base64)
        let payload;
        try {
            payload = JSON.parse(atob(parts[1]));
        } catch (e) {
            if (isDebugMode()) {
                console.error('[Token Validation] Base64 decoding or JSON parsing failed:', e.message);
            }
            return false;
        }
        
        // Check if exp exists in payload
        if (!payload.exp) {
            if (isDebugMode()) {
                console.warn('[Token Validation] Missing expiration claim (exp) in token payload');
            }
            return false; // Missing expiration claim
        }
        
        const exp = payload.exp * 1000; // Convert to milliseconds
        const now = Date.now();
        const isValid = exp > now;
        
        if (isDebugMode()) {
            if (!isValid) {
                console.warn('[Token Validation] Token expired. Exp:', new Date(exp), 'Now:', new Date(now));
            } else {
                console.debug('[Token Validation] Token is valid. Expires at:', new Date(exp));
            }
        }
        
        return isValid;
    } catch (e) {
        // Handle any other errors
        if (isDebugMode()) {
            console.error('[Token Validation] Unexpected error during token validation:', e);
        }
        return false;
    }
}

function isDebugMode() {
    return localStorage.getItem('DEBUG_MODE') === 'true';
}

function redirectToLogin() {
    clearAuthToken();
    // Try to clear cookie via logout endpoint if available
    // This is a best-effort attempt - if it fails, cookie will expire naturally
    fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
    }).catch(() => {
        // Ignore errors - cookie will be cleared by backend on next invalid request
    });
    window.location.href = 'login.html';
}

// Main API request function
async function apiRequest(method, path, body = null, requiresAuth = true, autoRedirect = false) {
    const url = `${API_BASE_URL}${path}`;
    const headers = {
        'Content-Type': 'application/json'
    };
    // http://localhost:8090/admin/locations
    // Add authorization header if required
    if (requiresAuth) {
        // Verify token validity before making request
        if (!isTokenValid()) {
            redirectToLogin();
            throw new Error('Invalid or expired authentication token');
        }
        
        const token = getAuthToken();
        if (!token) {
            redirectToLogin();
            throw new Error('No authentication token');
        }
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
        method: method,
        headers: headers
    };
    
    if (body !== null) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
        
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            credentials: 'include' // IMPORTANT: Send cookies with request (for HttpOnly cookie support)
        });
        
        clearTimeout(timeoutId);
        
        // Handle 401 Unauthorized
        if (response.status === 401) {
            // Verify token validity before redirecting
            // This helps distinguish between expired token vs backend issues
            const tokenStillValid = isTokenValid();
            if (!tokenStillValid) {
                // Token is actually invalid, clear it and redirect
                clearAuthToken();
                if (autoRedirect) {
                    redirectToLogin();
                }
                throw new Error('Unauthorized - token expired or invalid');
            } else {
                // Token is valid but backend returned 401
                // This might be a backend issue, but still clear token for security
                if (isDebugMode()) {
                    console.warn('[API] Received 401 but token appears valid. This might indicate a backend issue.');
                }
                clearAuthToken();
                if (autoRedirect) {
                    redirectToLogin();
                }
                throw new Error('Unauthorized - please login again');
            }
        }
        
        // Handle 403 Forbidden
        if (response.status === 403) {
            throw new Error('Access forbidden - insufficient permissions');
        }
        
        // Handle 404 Not Found
        if (response.status === 404) {
            throw new Error('Resource not found');
        }
        
        // Handle 500 Server Error
        if (response.status >= 500) {
            const clonedResponse = response.clone();
            const contentType = response.headers.get('content-type');
            let errorMessage = `Server error: ${response.status}`;
            try {
                if (contentType && contentType.includes('application/json')) {
                    const errorJson = await response.json();
                    errorMessage = errorJson.error || errorMessage;
                } else {
                    const errorText = await response.text();
                    if (errorText) {
                        errorMessage = errorText;
                    }
                }
            } catch (e) {
                // If parsing fails, try to read from cloned response
                console.error('Error parsing error response:', e);
                try {
                    const errorText = await clonedResponse.text();
                    if (errorText) {
                        errorMessage = errorText;
                    }
                } catch (textError) {
                    // If even text parsing fails, use default message
                    console.error('Error reading error response as text:', textError);
                }
            }
            throw new Error(errorMessage);
        }
        
        // Handle successful responses
        if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return await response.text();
            }
        }
        
        // Handle other error statuses (400-499)
        const clonedResponse = response.clone();
        const contentType = response.headers.get('content-type');
        let errorMessage = `HTTP ${response.status}: Request failed`;
        try {
            if (contentType && contentType.includes('application/json')) {
                const errorJson = await response.json();
                errorMessage = errorJson.error || errorJson.message || errorMessage;
            } else {
                const errorText = await response.text();
                if (errorText) {
                    errorMessage = `HTTP ${response.status}: ${errorText}`;
                } else {
                    errorMessage = `HTTP ${response.status}: Request failed`;
                }
            }
        } catch (e) {
            // If parsing fails, try to read from cloned response
            console.error('Error parsing error response:', e);
            try {
                const errorText = await clonedResponse.text();
                if (errorText) {
                    errorMessage = `HTTP ${response.status}: ${errorText}`;
                }
            } catch (textError) {
                // If even text parsing fails, use default message
                console.error('Error reading error response as text:', textError);
            }
        }
        throw new Error(errorMessage);
        
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Request timeout - please try again');
        }
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || 
            error.message.includes('ERR_INCOMPLETE_CHUNKED_ENCODING') || 
            error.message.includes('incomplete chunked encoding')) {
            throw new Error('Network error - please check your connection and try again');
        }
        throw error;
    }
}

// Convenience methods
const api = {
    get: (path, requiresAuth = true) => apiRequest('GET', path, null, requiresAuth),
    post: (path, body, requiresAuth = true) => apiRequest('POST', path, body, requiresAuth),
    put: (path, body, requiresAuth = true) => apiRequest('PUT', path, body, requiresAuth),
    delete: (path, requiresAuth = true) => apiRequest('DELETE', path, null, requiresAuth),
    
    // Token management
    getToken: getAuthToken,
    setToken: setAuthToken,
    clearToken: clearAuthToken,
    isTokenValid: isTokenValid,
    
    // Utility
    redirectToLogin: redirectToLogin
};

