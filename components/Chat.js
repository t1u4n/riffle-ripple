import axios from "axios";
import Pusher from "pusher";
import { Component } from "react";

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
            axios.post('/messages')
                .then(response => {
                    const chats = response.data.messages;
                    this.setState({ chats });
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
          axios.post('/message', chat);
        }
    }

    render() {
        return (this.props.activeUser && 
            <Fragment>
                <div className="border-bottom border-gray w-100 d-flex align-items-center bg-white" style={{ height: 90 }}>
                    <h2 className="text-dark mb-0 mx-4 px-2">{this.props.activeUser}</h2>
                </div>
                
                <div className="border-top border-gray w-100 px-4 d-flex align-items-center bg-light" style={{ minHeight: 90 }}>
                    <textarea className="form-control px-3 py-2" onKeyUp={this.handleKeyUp} placeholder="Enter a chat message" style={{ resize: 'none' }}></textarea>
                </div>
            </Fragment> 
        )
    }
}

export default Chat;
