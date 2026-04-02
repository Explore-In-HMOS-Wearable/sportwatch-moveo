export function getTime() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();

    minutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${hours}:${minutes}`;
}