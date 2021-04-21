function generate_prompt() {
    var classes = [
        "envelope", "triangle", "paper clip",
        "lightbulb", "coffee cup", "smiley face", "flower",
        "diving board", "car", "apple", "bicycle", "ladder",
        "eye", "cloud", "hammer",
    ];
    var secondaries = [
        "eating a banana",
        "eating grapes",
        "bowling",
        "painting",
        "exploding",
        "driving a tractor",
        "studying",
        "drinking whiskey",
        "debating",
        "struck by lightning",
        "trying its best",
        "that doesn’t like the color blue",
        "that never changes",
        "that solves world hunger",
        "in the closet",
    ];
    var rn1 = Math.floor(Math.random() * classes.length);
    var rn2 = Math.floor(Math.random() * secondaries.length);
    var prompt = classes[rn1] + " " + secondaries[rn2];
    document.getElementById('prompt').innerHTML = prompt;
}