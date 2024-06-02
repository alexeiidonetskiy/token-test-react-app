import jwtDefaultConfig from './jwt.config.ts';
import {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios';

export default class JwtService {
    private axiosIns: AxiosInstance;
    private jwtConfig = {...jwtDefaultConfig};
    private isAlreadyFetchingAccessToken = false;
    private subscribers: ((accessToken: string) => void)[] = [];

    constructor(axiosIns: AxiosInstance) {
        this.axiosIns = axiosIns;

        // Request Interceptor
        this.axiosIns.interceptors.request.use(
            (config: AxiosRequestConfig) => {
                const accessToken = this.getToken();
                if (accessToken) {
                    config.headers = config.headers || {};
                    config.headers.Authorization = `${this.jwtConfig.tokenType} ${accessToken}`;
                }
                return config;
            },
            error => Promise.reject(error),
        );

        // Response Interceptor
        this.axiosIns.interceptors.response.use(
            (response: AxiosResponse) => response,
            async (error: any) => {
                const {config, response} = error;
                const originalRequest = config;

                if (response && response.status === 401) {
                    if (this.jwtConfig.loginEndpoint === response.config.url) {
                        return Promise.reject(error);
                    }

                    if (!this.isAlreadyFetchingAccessToken) {
                        this.isAlreadyFetchingAccessToken = true;
                        try {
                            const r = await this.refreshToken();
                            this.isAlreadyFetchingAccessToken = false;

                            // Update accessToken in localStorage
                            this.setToken(r.data.accessToken);
                            this.setRefreshToken(r.data.refreshToken);

                            this.onAccessTokenFetched(r.data.accessToken);
                        } catch (e) {
                            this.isAlreadyFetchingAccessToken = false;
                            return Promise.reject(e);
                        }
                    }

                    return new Promise(resolve => {
                        this.addSubscriber((accessToken: string) => {
                            originalRequest.headers.Authorization = `${this.jwtConfig.tokenType} ${accessToken}`;
                            resolve(this.axiosIns(originalRequest));
                        });
                    });
                }
                return Promise.reject(error);
            },
        );
    }

    public login(...args: any[]): Promise<AxiosResponse> {
        return this.axiosIns.post(this.jwtConfig.loginEndpoint, ...args);
    }

    public logout(...args: any[]): Promise<AxiosResponse> {
        return this.axiosIns.post(this.jwtConfig.logoutEndpoint, ...args);
    }

    public sendProtectedRequest(...args: any[]): Promise<AxiosResponse> {
        return this.axiosIns.get(this.jwtConfig.protectedEndpoint, ...args);
    }

    public setToken(value: string): void {
        localStorage.setItem(this.jwtConfig.storageTokenKeyName, value);
    }

    public setRefreshToken(value: string): void {
        localStorage.setItem(this.jwtConfig.storageRefreshTokenKeyName, value);
    }

    public clearTokens(): void {
        localStorage.removeItem(this.jwtConfig.storageTokenKeyName);
        localStorage.removeItem(this.jwtConfig.storageRefreshTokenKeyName);
    }

    public getToken(): string | null {
        return localStorage.getItem(this.jwtConfig.storageTokenKeyName);
    }

    private onAccessTokenFetched(accessToken: string): void {
        this.subscribers.forEach(callback => callback(accessToken));
        this.subscribers = [];
    }

    private addSubscriber(callback: (accessToken: string) => void): void {
        this.subscribers.push(callback);
    }

    private getRefreshToken(): string | null {
        return localStorage.getItem(this.jwtConfig.storageRefreshTokenKeyName);
    }

    private async refreshToken(): Promise<AxiosResponse> {
        try {
            return await this.axiosIns.post(this.jwtConfig.refreshEndpoint, {
                refreshToken: this.getRefreshToken(),
            });
        } catch (e: any) {
            if (e && String(e.message).includes('code 422')) {
                localStorage.removeItem(this.jwtConfig.storageTokenKeyName);
                localStorage.removeItem(this.jwtConfig.storageRefreshTokenKeyName);
            }
            throw e;
        }
    }
}
