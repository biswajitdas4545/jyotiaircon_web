import React, { useState } from 'react';
import Header from '../header';
import Nabvar from '../navbar';
import './Login.css';

function Login() {
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('Admin@123');

    const handleLogin = async () => {
        const loginUrl = 'https://jyotiairconditioning.in/websercice/api/auth/login';

        try {
            const response = await fetch(loginUrl, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password
                })
            });

            console.log('Login API response status:', response.status, response.statusText);
            const contentType = response.headers.get('content-type') || '';

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Login API non-OK response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (!contentType.includes('application/json')) {
                const unexpectedText = await response.text();
                console.error('Login API returned a non-JSON response:', unexpectedText);
                throw new Error('Expected JSON login response but got HTML/content from the app host.');
            }

            const data = await response.json();
            if (data?.success === false) {
                throw new Error(data?.message || 'Login failed. Please check your credentials.');
            }

            window.location.href = "/dashboard";
        } catch (error) {
            console.error('Login API failed:', error);
            alert('Login failed. Please try again.');
        }
    };

    return (
        <div>
            <section
                className="content"
                style={{
                    maxWidth: "400px",
                    margin: "0 auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "80vh"
                }}
            >
                <div className="row" style={{ width: "100%" }}>
                    <div className="login-box" style={{ width: "100%" }}>
                        <div className="login-box-body">
                            <form>
                                <div className="form-group has-feedback">
                                    <input
                                        name="username"
                                        className="form-control"
                                        placeholder='Enter User Id'
                                        value={username}
                                        onChange={(event) => setUsername(event.target.value)}
                                    />
                                    <span className="glyphicon glyphicon-user form-control-feedback"></span>
                                </div>
                                <div className="form-group has-feedback">
                                    <input
                                        name="password"
                                        type="password"
                                        className="form-control"
                                        placeholder='Enter Password'
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                    />
                                    <span className="glyphicon glyphicon-log-in form-control-feedback"></span>
                                </div>
                                <div className="form-group has-feedback" style={{ display: "flex", justifyContent: "center" }}>
                                    <input
                                        type="button"
                                        value="Log In"
                                        id="goButton"
                                        className="btn btn-primary btn-block btn-flat"
                                        style={{ maxWidth: "150px" }}
                                        onClick={handleLogin}
                                    />
                                </div>
                            </form>
                            <div className="clearfix"></div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Login;