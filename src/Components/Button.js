import React from 'react'

const Button = ({ text, onClick, image }) => {
    return (
        <button onClick={onClick} id={image} >
            <div><img src={image} alt={text}></img><div><b>{text}</b></div></div>
        </button>
    )
}

export default Button
