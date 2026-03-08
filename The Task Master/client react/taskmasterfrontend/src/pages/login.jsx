import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const { checkAuth } = useAuth();
    const [userDetails, setUserDetails] = useState({
        email: '',
        password: ''
    });

    function updateUserDeatils(event) {
        const { name, value } = event.target;

        setUserDetails((prevDetails) => {
            return {
                ...prevDetails,
                [name]: value
            }
        });
    }

    async function login(event) {

        event.preventDefault();
        const payload = JSON.stringify({
            email: userDetails.email,
            password: userDetails.password
        })

        if (userDetails.email && userDetails.password) {
            await fetch("http://localhost:4444/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: payload,
                credentials: "include"
            }).then(
                res => res.json()
            ).then((res) => {
                console.log(res);
                navigate('/tasks');
                checkAuth();
            }).catch(err => {
                console.log(err);
            });
        }
    }

    return (<>
        <form>
            <input type="email" name="email" placeholder="Enter email here." onChange={updateUserDeatils} />
            <input type="password" name="password" placeholder="Enter password here." onChange={updateUserDeatils} />
            <button type="submit" onClick={login}>Submit</button>
        </form>
    </>);
}

export default Login;