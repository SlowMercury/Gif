/*
 * ============================================================
 *  DATA.JS — Page data for GIF Description Practice
 * ============================================================
 *
 *  HOW TO ADD A NEW PAGE
 *  ---------------------
 *  1. Copy the template below.
 *  2. Paste it at the END of the `pages` array (before the closing ];)
 *  3. Fill in your own title, GIF URL, and questions/answers.
 *  4. Make sure there is a comma after the previous page's closing }
 *  5. The `id` should be the next number in sequence.
 *
 *  GIF TIPS:
 *  - You can use a URL from Giphy, Tenor, Imgur, etc.
 *  - Or place a .gif file in the /gifs/ folder and use a
 *    relative path like "gifs/my-funny-cat.gif"
 *
 *  TEMPLATE — Copy everything between the dashed lines:
 *  - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 *
 *  {
 *    id: NUMBER,
 *    title: "Your Title Here",
 *    gifUrl: "https://example.com/your-gif.gif",
 *    questions: [
 *      {
 *        question: "Your first question?",
 *        answer: "An example answer the student can reveal."
 *      },
 *      {
 *        question: "Your second question?",
 *        answer: "Another example answer."
 *      },
 *      {
 *        question: "Your third question?",
 *        answer: "One more example answer."
 *      }
 *    ]
 *  }
 *
 *  - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 *
 *  You can have as many questions per page as you like (2, 3, 5…).
 *  Just keep copying the { question, answer } blocks inside the array.
 *
 * ============================================================
 */

const pages = [
    {
      id: 1,
      title: "Confused Cat",
      gifUrl: "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXVmcGdzaXZpc2tvZTBiczY0Zm13NzV0NXIyd3dhMzdscHRoOXJoZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT5LMOvzyqSyIGqlsk/giphy.gif",
      questions: [
        {
          question: "What is the animal doing?",
          answer: "The cat is sitting on the table and looking around with a very confused expression."
        },
        {
          question: "How would you describe its emotion?",
          answer: "It looks bewildered and slightly alarmed, as if it doesn't understand what just happened."
        },
        {
          question: "What might have happened right before this moment?",
          answer: "Someone might have made a sudden noise or moved an object, and now the cat is trying to figure out what's going on."
        }
      ]
    },
    {
      id: 2,
      title: "Surprised Cat Returns",
      gifUrl: "./gifs/giphy-2.gif",
      questions: [
        {
          question: "Describe the setting. Where is the cat?",
          answer: "The cat appears to be indoors, possibly in a living room or kitchen, sitting on a flat surface like a table or counter."
        },
        {
          question: "If this cat could talk, what would it say?",
          answer: "It might say something like, 'Wait, what just happened?!' or 'Did you see that too, or am I going crazy?'"
        },
        {
          question: "Use three adjectives to describe the cat's face.",
          answer: "The cat's face looks startled, wide-eyed, and utterly perplexed."
        }
      ]
    },
    {
      id: 3,
      title: "Cat Has Questions",
      gifUrl: "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXVmcGdzaXZpc2tvZTBiczY0Zm13NzV0NXIyd3dhMzdscHRoOXJoZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT5LMOvzyqSyIGqlsk/giphy.gif",
      questions: [
        {
          question: "Tell the story of this GIF in 2–3 sentences.",
          answer: "A cat is sitting calmly when something catches its attention. It turns its head and stares with a look of total confusion, as though the universe has stopped making sense."
        },
        {
          question: "Compare this cat to a person. Who does it remind you of?",
          answer: "It reminds me of a student who just heard the teacher say, 'The test is today,' — completely shocked and unprepared."
        },
        {
          question: "What would be a good caption or meme text for this GIF?",
          answer: "A good caption might be: 'When someone explains the rules and you pretend to understand,' or 'Me, five seconds into a math problem.'"
        }
      ]
    },
    {
      id: 4,
      title: "GIF #4",
      gifUrl: "./Gifs/The Simpsons Reaction GIF.gif",
      questions: [
        {
          question: "What's happening at first?",
          answer: "At first he kneels before Lisa, on the green grass smiling widely. He stares at Lisa and she stares back at him. She stays on top of the hill looking down at him."
        },
        {
          question: "Where are they?",
          answer: "They're at the top of the hill. Standing in the grass."
        },
        {
          question: "What happens next?",
          answer: "Millhouse rolls down the hill, as Lisa stares at him. He goes down the hill."
        },
        {
          question: "What else can you say about this scene?",
          answer: "He smiles. He is in a great mood. She is pokerface. Maybe slightly shocked inside. Weather is good. It's sunny. Few clouds in the sky."
        }
      ]
    },
    {
      id: 5,
      title: "GIF #5",
      gifUrl: "./Gifs/Angry Inside Out GIF by Disney Pixar.gif",
      questions: [
        {
          question: "What emotions does he feel?",
          answer: "He is very angry."
        },
        {
          question: "What happens?",
          answer: "Massive fire starts from the top of his head. Suddenly, fire erupts from his head. The top of his head explodes with fire."
        },
        {
          question: "Describe the characters.",
          answer: "He is red, in an office suit, and very very angry. Behind him — a scared guy."
        },
        {
          question: "What should happen, so you would feel the same way?",
          answer: "If I go to work, but it's Sunday and no one's working that day."
        }
      ]
    },
    {
      id: 6,
      title: "GIF #6",
      gifUrl: "./Gifs/full house eating GIF.gif",
      questions: [
        {
          question: "What is the girl doing?",
          answer: "Girl is eating pasta. She must be very hungry."
        },
        {
          question: "Describe what you see on the table.",
          answer: "She has a lot of pasta in her plate. Things are messy and she's going to have stains all over the place."
        },
        {
          question: "How is she sitting and what is she holding?",
          answer: "She is sitting in a chair, and holding a spoon in each hand."
        }
      ]
    },
    {
      id: 7,
      title: "GIF #7",
      gifUrl: "./Gifs/angry family guy GIF-2.gif",
      questions: [
        {
          question: "What is Stewie doing at the start?",
          answer: "Stewie is sitting on the sofa and watching TV."
        },
        {
          question: "What happens next?",
          answer: "Black guy is very angry, so he throws the sofa in the air, turning it upside down."
        },
        {
          question: "What can you say about the characters?",
          answer: "Black guy must be very strong. Stewie must be unhappy with that situation. Stewie might get hurt."
        }
      ]
    },
    {
      id: 8,
      title: "GIF #8",
      gifUrl: "./Gifs/Homer Simpson Cooking GIF.gif",
      questions: [
        {
          question: "What is Homer wearing?",
          answer: "Homer is in a chef's clothes. He is probably hungry, so he is cooking now."
        },
        {
          question: "What does he do step by step?",
          answer: "At first he took the milk box, and poured some milk inside the plate. Then added cornflakes in it."
        },
        {
          question: "What goes wrong?",
          answer: "After that the plate started burning — like a volcano. Something went wrong. And now it's not gonna be delicious."
        }
      ]
    },
    {
      id: 9,
      title: "GIF #9",
      gifUrl: "./Gifs/Sesame Street Dancing GIF.gif",
      questions: [
        {
          question: "Where is the baby?",
          answer: "Little baby is sitting on a toilet."
        },
        {
          question: "What is the baby doing and how does he feel?",
          answer: "He has a very good mood, so he's dancing."
        }
      ]
    },
    {
      id: 10,
      title: "GIF #10",
      gifUrl: "./Gifs/spongebob squarepants singing GIF.gif",
      questions: [
        {
          question: "Where is SpongeBob?",
          answer: "SpongeBob is on the stage in the club."
        },
        {
          question: "What is he doing?",
          answer: "He is singing and playing guitar."
        },
        {
          question: "How would you describe his mood?",
          answer: "He is chill, his eyes are half closed. He might be very relaxed or sleepy."
        }
      ]
    },
    {
      id: 11,
      title: "GIF #11",
      gifUrl: "./Gifs/angry family guy GIF.gif",
      questions: [
        {
          question: "How does Stewie feel?",
          answer: "Stewie is very angry."
        },
        {
          question: "What is he doing?",
          answer: "He's hitting his teddy bear."
        },
        {
          question: "Describe the scene.",
          answer: "He sits besides the sofa, holding a bear in one hand and hitting him with another hand."
        }
      ]
    },
    {
      id: 12,
      title: "GIF #12",
      gifUrl: "./Gifs/jim carrey dancing GIF.gif",
      questions: [
        {
          question: "What is happening in this scene?",
          answer: "Everyone is dancing here. Jim Carrey is in the skirt."
        },
        {
          question: "Describe how the main character is dancing.",
          answer: "He is dancing weird. He keeps his hands raised, while moving only his legs. He moves his knees together, and then moves them apart."
        },
        {
          question: "Who else is in the scene?",
          answer: "Behind him there are a lot of old people."
        }
      ]
    },
    {
      id: 13,
      title: "GIF #13",
      gifUrl: "./Gifs/penguin running GIF.gif",
      questions: [
        {
          question: "What animal do you see and what is it doing?",
          answer: "Little cute penguin is running on the snow."
        },
        {
          question: "Describe the weather.",
          answer: "It's a sunny day, but he probably feels cold."
        },
        {
          question: "How is the penguin moving?",
          answer: "He's moving his legs so fast, to get to the place."
        }
      ]
    },
    {
      id: 14,
      title: "GIF #14",
      gifUrl: "./Gifs/giphy.gif",
      questions: [
        {
          question: "What is the monkey wearing?",
          answer: "This is a monkey in sunglasses. He looks cool."
        },
        {
          question: "What happens to the sunglasses?",
          answer: "He tilted his head forward and the glasses slipped off his face."
        },
        {
          question: "What does the monkey do next?",
          answer: "Then monkey puts it back with its hand."
        }
      ]
    }
  ];
  