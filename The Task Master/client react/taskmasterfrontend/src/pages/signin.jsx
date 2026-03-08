import { useState } from "react";
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
const SignIn = () => {
    const { checkAuth } = useAuth();
    const navigate = useNavigate();
    const [userDetails, setUserDetails] = useState({
        email: '',
        password: '',
        name: ''
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

    async function signInFxn(event) {
        event.preventDefault();

        if (userDetails.email && userDetails.name && userDetails.password) {
            console.log("Signin Details: ", userDetails);
            let payload = JSON.stringify({
                name: userDetails.name, email: userDetails.email, password: userDetails.password
            });

            await fetch("http://localhost:4444/signup", {
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
                checkAuth();
                setTimeout(() => {
                    navigate('/tasks');
                })
            }).catch(err => {
                console.log(err);
            });
        }
    }

    return (<>
        <form>
            <input type="text" name="name" placeholder="Enter name here." onChange={updateUserDeatils} />
            <input type="email" name="email" placeholder="Enter email here." onChange={updateUserDeatils} />
            <input type="password" name="password" placeholder="Enter password here." onChange={updateUserDeatils} />
            <button type="submit" onClick={signInFxn}>Submit</button>
        </form>
    </>);
}

export default SignIn;