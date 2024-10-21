// Loading.js
import React from "react";
import './Loader.css';

const Loading = () => {
    const hash = window.location.hash.slice(1);

    const params = new URLSearchParams(hash);
    const themeParams = params.get('tgWebAppThemeParams');

    let style = {};

    if (themeParams)
    {
        style = {backgroundColor: themeParams.header_bg_color}
    } else
    {
        style = {backgroundColor: "rgba(12, 12, 12, 0.8)"}
    }

    return (
        <div className="loader-container" style={style}>
            <div className="custom-loader"></div>
        </div>
    );
};

export default Loading;