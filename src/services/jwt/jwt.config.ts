export default {
    loginEndpoint: `http://localhost:3000/auth/login`,
    refreshEndpoint: `http://localhost:3000/auth/refresh-token`,
    logoutEndpoint: `http://localhost:3000/auth/logout`,
    protectedEndpoint: `http://localhost:3000/user`,
    tokenType: 'Bearer',
    storageTokenKeyName: 'accessToken',
    storageRefreshTokenKeyName: 'refreshToken',
};
