import axios from "axios";
import Pusher from "pusher-js";
import React, { Component, Fragment } from "react";
import ChatMessages from "./ChatMessages";

const SAD_EMOJI = [55357, 56864];
const HAPPY_EMOJI = [55357, 56832];
const NEUTRAL_EMOJI = [55357, 56848];


class Chat extends Component {
    state = { chats: [] }

    /**
     * Connect to pusher and fetch history message when mount the component
     */
    componentDidMount() {
        // Create a Pusher instance using environment variables for Pusher app credentials
        this.pusher = new Pusher(process.env.PUSHER_APP_KEY, {
            cluster: process.env.PUSHER_APP_CLUSTER,
            encrypted: true
        });

        // Subscribe to the 'chat-room' channel
        this.channel = this.pusher.subscribe('chat-room');

        // Add new messages to the component's state when they arrive
        this.channel.bind('new-message', ({ chat = null }) => {
            const chats = this.state.chats;
            chat && chats.push(chat);
            this.setState({ chats });
        });

        // After a successful Pusher connection, fetch historical chat messages from the server using Axios
        this.pusher.connection.bind('connected', () => {
            axios.post('/api/messages')
                .then(response => {
                    const chats = response.data.messages || [];
                    this.setState({ chats });
                })
                .catch(exception => {
                    console.error("Failed to fetch chat history", exception.stack)
                });
        });
    }

    /**
     * Release pusher resource to prevent resource leak
     */
    componentWillUnmount() {
        // Disconnect from Pusher when the component is unmounted
        this.pusher.disconnect();
    }

    /**
     * Send chat message when enter button is touched
     * 
     * @param {*} evt is the key event 
     */
    handleKeyUp = evt => {
        const value = evt.target.value;
        
        if (evt.keyCode === 13 && !evt.shiftKey) {
          const { activeUser: user } = this.props;
          const chat = { user, message: value, timestamp: +new Date };
          
          evt.target.value = '';

          axios.post('/api/message', chat)
          .catch(exception => {
            console.error("Failed to send message", exception.stack)
          });
        }
    }

    render() {
        return (this.props.activeUser && 
            <Fragment>
                <div className="border-bottom border-gray w-100 d-flex align-items-center bg-white" style={{ height: 90 }}>
                    <h2 className="text-dark mb-0 mx-4 px-2">{this.props.activeUser}</h2>
                </div>
                
                <div className="px-4 pb-4 w-100 d-flex flex-row flex-wrap align-items-start align-content-start position-relative" style={{ height: 'calc(100% - 180px)', overflowY: 'scroll' }}>
                    {this.state.chats.map((chat, index) => {
                        const previous = Math.max(0, index - 1);
                        const previousChat = this.state.chats[previous];
                        const position = chat.user === this.props.activeUser ? "right" : "left";
                        
                        const isFirst = previous === index;
                        const inSequence = chat.user === previousChat.user;
                        const hasDelay = Math.ceil((chat.timestamp - previousChat.timestamp) / (1000 * 60)) > 1;
                        
                        const mood = chat.sentiment > 0 ? HAPPY_EMOJI : (chat.sentiment === 0 ? NEUTRAL_EMOJI : SAD_EMOJI);
                        
                        return (
                            <Fragment key={index}>
                                { (isFirst || !inSequence || hasDelay) && (
                                <div className={`d-block w-100 font-weight-bold text-dark mt-4 pb-1 px-1 text-${position}`} style={{ fontSize: '0.9rem' }}>
                                    <span className="d-block" style={{ fontSize: '1.6rem' }}>
                                    {String.fromCodePoint(...mood)}
                                    </span>
                                    <span>{chat.user || 'Anonymous'}</span>
                                </div>
                                ) }
                                <ChatMessages message={chat.message} position={position} />  
                            </Fragment>
                        );
                    })}
                </div>

                <div className="border-top border-gray w-100 px-4 d-flex align-items-center bg-light" style={{ minHeight: 90 }}>
                    <textarea className="form-control px-3 py-2" onKeyUp={this.handleKeyUp} placeholder="Enter a chat message" style={{ resize: 'none' }}></textarea>
                </div>
            </Fragment> 
        )
    }
}

export default Chat;
