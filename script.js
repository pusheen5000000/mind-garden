
document.addEventListener("DOMContentLoaded", () => {
  console.log("Mind Garden loaded. Ready to play!");
});

document.addEventListener("mousemove", function(e) {
    if (Math.random() > 0.35) return; // only create sometimes

    const sparkle = document.createElement("div");
    sparkle.className = "sparkle";

    sparkle.style.left = e.pageX + "px";
    sparkle.style.top = e.pageY + "px";

    document.body.appendChild(sparkle);

    setTimeout(() => {
        sparkle.remove();
    }, 1500);
});