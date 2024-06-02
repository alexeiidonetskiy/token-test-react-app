import React, {useEffect, useRef, useState} from 'react';
import './App.css';
import JwtService from "./services/jwt/jwt.service";
import axios from 'axios';

const JwtServiceInstance = new JwtService(axios);

function App() {
    const [isLoggedUser, setLoggedUser] = useState(false);
    const emailRef = useRef(null);
    const passwordRef = useRef(null);

    useEffect(() => {
        const isLoggedUser = JwtServiceInstance.getToken();
        setLoggedUser(!!isLoggedUser);
    }, [])

    const loginAction = async (e) => {
        e.preventDefault();

        try {

            const result = await JwtServiceInstance.login({
                email: emailRef.current.value,
                password: passwordRef.current.value
            });

            const {accessToken, refreshToken} = result.data;
            JwtServiceInstance.setToken(accessToken);
            JwtServiceInstance.setRefreshToken(refreshToken);

            setLoggedUser(true);


        } catch (e) {
            console.log('Error loging user: ', e);
        }
    }

    const sendProtectedRequest = async (e) => {
        e.preventDefault();
        await JwtServiceInstance.sendProtectedRequest();
    }

    const handleLogout = async e => {
        e.preventDefault();
        try {
            await JwtServiceInstance.logout();
        } catch (e) {
            console.log('Error logging out', e);
        } finally {
            JwtServiceInstance.clearTokens();
            setLoggedUser(false);
        }
    }

    return (
        <>
            <h3>Welcome to Refresh Token Playground!</h3>

            {!isLoggedUser && <form
                style={{display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '300px', margin: '0 auto'}}
                onSubmit={loginAction}>
                <input type="email" placeholder='Email' ref={emailRef}/>
                <input type="password" placeholder='Password' ref={passwordRef}/>
                <button type="submit">Login</button>
            </form>}

            {isLoggedUser &&
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    maxWidth: '300px',
                    margin: '0 auto'
                }}>
                    <button type="submit" onClick={sendProtectedRequest}>Send protected request</button>
                    <button type="submit" onClick={handleLogout}>Logout</button>
                </div>
            }
        </>
    );
}

export default App;
