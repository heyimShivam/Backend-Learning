import { useNavigate } from 'react-router-dom';
const Logout = () => {
    const navigate = useNavigate();
    const logoutFxn = async () => {
        await fetch("http://localhost:4444/logout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        }).then(
            res => res.json()
        ).then((res) => {
            console.log(res);
            navigate('/login');
        }).catch(err => {
            console.log(err);
        });
    };

    return (<>
        <button onClick={logoutFxn}>Logout</button>
    </>);
}
export default Logout;