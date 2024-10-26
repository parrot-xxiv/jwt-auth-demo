# Simple demo for implementing JWT auth
1. **User Registration**
   - **Register user.**  
     This is done in the `app.post('/register', ...)` route.
   - **Check exist.**  
     It checks if the username already exists with `if (users.find(u => u.username === username))`.
   - **Validate user data.**  
     Validated by checking if the username is already taken.
   - **Store the user in memory "database".**  
     The user is stored in the `users` array.

2. **User Login**
   - **Submit to `/login` route.**  
     Handled in `app.post('/login', ...)`.
   - **Validate user credentials.**  
     Validated with `const user = users.find(u => u.username === username);`.
   - **Generate a JWT and a refresh token.**  
     Tokens are generated with `const { accessToken, refreshToken } = generateTokens(user.id, user.username);`.

3. **Accessing Private Routes**
   - **Create middleware to protect routes.**  
     The `authenticateToken` function serves as middleware.
   - **Verify the Access Token.**  
     The token is verified using `jwt.verify(accessToken, SECRET_KEY, ...)`, although it's checked in cookies rather than the Authorization header.

4. **Handling Token Refresh**
   - **Checking access token validity.**  
     Handled in the `authenticateToken` function.
   - **Validate the refresh token.**  
     Validated with `if (!refreshToken || !refreshTokens.includes(refreshToken))`.
   - **Generate a new access token.**  
     A new access token is generated in `handleRefreshToken` with `const newAccessToken = generateTokens(user.id, user.username).accessToken;`.

5. **Logout**
   - **Create a logout route.**  
     Handled in `app.get('/logout', ...)`.
   - **Invalidate the refresh token in the database.**  
     Refresh tokens are filtered out with `refreshTokens = refreshTokens.filter(token => token !== req.cookies.refreshToken);`.

6. **Error Handling for Invalid Tokens**
   - **Handle token expiration and invalidity in middleware.**  
     Managed in `authenticateToken`, which handles errors from `jwt.verify` and redirects to a 403 error page.