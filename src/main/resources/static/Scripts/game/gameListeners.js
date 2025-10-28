

// ===== Chat =====
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') sendMessage();
});
chatBtn.addEventListener('click', () => {
    unseenCount = 0;
    chatBadge.classList.add("hidden");
})

chatInput.addEventListener("focus", () => {
    chatMode = true;
})

chatInput.addEventListener("blur", () => {
    chatMode = false;
})

issueText.addEventListener("focus", () => {
    chatMode = true;
})

issueDialog.addEventListener("close", () => {
    document.body.focus();
})

issueDialog.addEventListener("open", () => {
    issueText.focus();
})

issueText.addEventListener("blur", () => {
    chatMode = false;
})

function handleKeyDown(e){
    if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
    }
}



window.addEventListener('keydown', e => {
    if(chatMode) {
        if(e.key === 'Escape') {
            document.body.focus();
        }
        return;
    }
    if (e.key === 'Enter') {
        chat.showModal();
        chatInput.focus();
        unseenCount = 0;
        chatBadge.classList.add("hidden");
    }
    if (e.key.toLowerCase() === '`') {
        if (action.open) {
            action.close();
        } else {
            action.showModal();
        }
    }
    if (e.key.toLowerCase() === 'r') {
        if (rule.open) {
            rule.close();
        } else {
            rule.showModal();
        }
    }
    if(hasDrawn) {
        if(e.ctrlKey) {
            swapPendingBtn.click();
        }
        if(e.key === ' ') {
            buttons.discard.click();
        }
    }
    if (e.shiftKey) {
        stickBtn.click();
    }
    if (e.key === ' ') {
        drawBtn.click();
    }
    if(e.key.toLowerCase() === 'c') {
        cambioBtn.click();
    }
})



function sendMessage() {
    const content = chatInput.value.trim();
    if (!content) return;

    const user = JSON.parse(sessionStorage.getItem("currentUser"));
    const message = {
        userId: user.userId,
        gameId: gameId,
        message: content,
        timestamp: Date.now()
    };

    console.log("sending message " + JSON.stringify(message));
    stompClient.send(`/app/game/${gameId}/chat`, {}, JSON.stringify(message));
    chatInput.value = '';
}

// ===== Buttons =====
buttons.discard.addEventListener("click", () => {
    console.log("Discarded pending draw");
    sendAction(gameId, currentUser.userId, currentUser.username, "DISCARD_PENDING",{});
    endTurn();
});

drawBtn.addEventListener("click", () => {
    console.log("Drew a card");
    sendAction(gameId, currentUser.userId, currentUser.username, "DRAW_DECK", {});
    cardPending = true;
});

playBtn.addEventListener("click", () => {
    swapModeActive = true;
    console.log("Swapping mode activated, select origin and destination cards");
});

cambioBtn.addEventListener("click", () => {
    console.log("Called Cambio!");
    sendAction(gameId, currentUser.userId, currentUser.username, "CALL_CAMBIO", {});
    endTurn();
});

swapPendingBtn.addEventListener("click", () => {
    console.log("Select one of your cards to swap with the drawn card");
    swapPendingModeActive = true;
});

stickBtn.addEventListener("click", () => {
    console.log("Stick!");
    stickModeActive = true;
})

cambioClose.addEventListener("click", () => {
    cambioModal.close();
})

// stickBtn.addEventListener("click", () => {
//     console.log("Stick");
//     sendAction(gameId, currentUser.userId, currentUser.username,"CALL_STICK", {});
// });

const usersMap = new Map();

async function fetchAvatar(id) {
    try {
        const response = await fetch("/api/getUser" + id, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
        });

        if (!response.ok) throw new Error("Failed to fetch users");

        const user = await response.json();

        avatarsMap.set(id, user.avatar)

    } catch (err) {
        console.error("Error fetching users:", err);
    }
}


start.addEventListener('click', async () => {


        sendAction(gameId, currentUser.userId, currentUser.username, "START", {});

});

// ===== Swap Mode (Card Clicks) =====
document.body.addEventListener("click", (card) => {
    let retry = false;
    if (card.target.matches("img.card")) {
        let raw = card.target.id.split("-");
        if(parseInt(raw[0], 10) === cambioPlayerId) {
            retry = true;
        }
        if(retry === false) {
            if (swapModeActive && !stickModeActive && !peekPlusActive) {
                if (swapState.originIndex === null) {
                    swapState.originUserId = parseInt(raw[0], 10);
                    swapState.originIndex = parseInt(raw[1], 10);
                    console.log("Origin card is " + swapState.originIndex + " and user Id is " + swapState.originUserId);
                    card.target.classList.add("border-4",  "border-solid",  "border-red-500")
                    console.log("Card border debug: ", card.target);
                    instructions.innerText = "choose the second card to swap with"
                    return;
                }
                if (swapState.destinationIndex === null) {
                    swapState.destinationIndex = parseInt(raw[1], 10);
                    swapState.destinationUserId = parseInt(raw[0], 10);
                    console.log("Destination card is " + swapState.destinationIndex + " and user Id is " + swapState.destinationUserId);

                    sendAction(gameId, currentUser.userId, currentUser.username, "SWAP", {
                        origin: swapState.originIndex,
                        originUserId: swapState.originUserId,
                        destination: swapState.destinationIndex,
                        destinationUserId: swapState.destinationUserId
                    });
                }
            } else if (stickModeActive) {
                if (swapState.originIndex === null) {
                    swapState.originUserId = parseInt(raw[0], 10);
                    swapState.originIndex = parseInt(raw[1], 10);
                    console.log("Origin card is " + swapState.originIndex + " and user Id is " + swapState.originUserId);
                    lastStickPlayer = swapState.originUserId;
                    sendAction(gameId, currentUser.userId, currentUser.username, "STICK", {
                        origin: swapState.originIndex,
                        originUserId: swapState.originUserId
                    })
                }
            } else if (giveModeActive) {
                if (swapState.originIndex === null) {
                    swapState.originUserId = parseInt(raw[0], 10);
                    swapState.originIndex = parseInt(raw[1], 10);
                    swapState.destinationUserId = lastStickPlayer;
                    if (swapState.originUserId === currentUser.userId) {
                        console.log("Origin card is " + swapState.originIndex + " and user Id is " + swapState.originUserId);
                        sendAction(gameId, currentUser.userId, currentUser.username, "GIVE", {
                            origin: swapState.originIndex,
                            originUserId: swapState.originUserId,
                            destinationUserId: swapState.destinationUserId
                        })
                    } else {
                        retry = true;
                    }
                }
            } else if (swapPendingModeActive) {
                if (swapState.destinationIndex === null) {
                    swapState.destinationIndex = parseInt(raw[1], 10);
                    swapState.destinationUserId = parseInt(raw[0], 10);
                    if (swapState.destinationUserId === currentUser.userId) {
                        console.log("Destination card is " + swapState.destinationIndex + " and user Id is " + swapState.destinationUserId);
                        sendAction(gameId, currentUser.userId, currentUser.username, "SWAP_PENDING", {
                            destination: swapState.destinationIndex,
                            destinationUserId: swapState.destinationUserId
                        })
                    } else {
                        console.log("You can only swap your pending card with one of your cards, try again");
                        retry = true;
                    }
                }
            } else if (peekMeActive) {
                let ID = parseInt(raw[0], 10);
                let IDX = parseInt(raw[1], 10);
                if (ID === currentUser.userId) {
                    sendAction(gameId, currentUser.userId, currentUser.username, "PEEK", {
                        id: ID,
                        idx: IDX
                    })
                    console.log("Peeked card " + IDX + "for userId " + IDX);
                } else {
                    console.log("CAN ONLY SELECT ONE OF YOUR CARDS TO PEEK")
                }
            } else if (peekAnyActive) {
                let ID = parseInt(raw[0], 10);
                let IDX = parseInt(raw[1], 10);
                sendAction(gameId, currentUser.userId, currentUser.username, "PEEK", {
                    id: ID,
                    idx: IDX
                })
                console.log("Peeked card " + IDX + "for userId " + IDX);
            } else if (peekPlusActive) {
                let ID = parseInt(raw[0], 10);
                let IDX = parseInt(raw[1], 10);
                sendAction(gameId, currentUser.userId, currentUser.username, "PEEK_PLUS", {
                    id: ID,
                    idx: IDX
                })
                console.log("Peeked card " + IDX + "for userId " + IDX);
            }
        }

        swapState = {
            originIndex: null,
            originUserId: null,
            destinationIndex: null,
            destinationUserId: null
        };
        if (!retry) {
            if (!peekPlusActive) {
                endTurn();
                keepInstructions = false;
            } else {
                endTurn();
                swapModeActive = true;
                instructions.innerText = "Choose a card to swap"
                keepInstructions = true;
            }
        }
        else {
            instructions.innerText = "Illegal move try again";
        }
    }
});


