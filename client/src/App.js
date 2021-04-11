import './App.css'
import { Container, Row, Col, Button, Card, ListGroup, Form } from 'react-bootstrap'
import socketIOClient from "socket.io-client";
import logo  from './logo.svg'
import React from 'react'
import axios from 'axios'
import _     from 'lodash'

// Initiate Socket.io
const socket = socketIOClient('http://localhost:3005')

// ---------------- Message Component
const Message = ({ message, user }) => {
  // eslint-disable-next-line
  if(message.key === 'SERVER')
    return (
      <div>
        <Card bg="dark" text="white">
          <Card.Header><strong>System:</strong> {message.value || '--'}</Card.Header>
          <Card.Footer> <small >{message.date}</small> </Card.Footer>
        </Card>
        <br></br>
      </div>
    )
  else if(message.key === 'error')
    return (
      <div>
        <Card bg="danger" >
          <Card.Header> <strong>Error:</strong> {message.value || '--'} </Card.Header>
          <Card.Footer> <small >{message.date}</small> </Card.Footer>
        </Card>
        <br></br>
      </div>
    )
  else if(message.key !== user.name)
    return (
      <div>
        <Card bg="success" >
          <Card.Body>
            <Card.Title>{message.key}</Card.Title>
            <Card.Text>{message.value}</Card.Text>
          </Card.Body>
          <Card.Footer> <small >{message.date}</small> </Card.Footer>
        </Card>
        <br></br>
      </div>
    )
  else return (
    <div>
      <Card bg="primary" >
        <Card.Header> <strong>Me: </strong> {message.value || '--'} </Card.Header>
        {/* <Card.Body> */}
          {/* <Card.Title>{user.name}</Card.Title> */}
          {/* <Card.Text>{message.value}</Card.Text> */}
        {/* </Card.Body> */}
        <Card.Footer> <small >{message.date}</small> </Card.Footer>
      </Card>
      <br></br>
    </div>
  )
}


// ---------------- App CLass
class App extends React.Component {

  constructor(props) {
    // Pass props to parent class
    super(props)

    // Set initial state
    this.state = {
      isLoggedIn: false,
      isLoading: false,
      isTyping: false,
      allMessages: [],
      allUsers: {},
      allRooms: [],
      user: {},
      workspaceId: 'shatel'
    }

    this.uploadUrl = 'http://localhost:3023/v1/files'
    this.apiUrl = 'http://localhost:3005'
    this.myRef  = React.createRef()

    // Bind All Functions
    this.getOrCreateUser = this.getOrCreateUser.bind(this)
    this.addNewRoom      = this.addNewRoom.bind(this)
    this.switchRoom      = this.switchRoom.bind(this)
    this.joinRoom        = this.joinRoom.bind(this)
    this.leaveRoom       = this.leaveRoom.bind(this)
    this.sendMessage     = this.sendMessage.bind(this)

    this.countUsers     = this.countUsers.bind(this)
  }

  // Always keeps the scroll down for messages
  scrollToBottom = () => {
    // this.myRef.scrollTo(0, 1000)
  }

  // Count of users in each room
  countUsers(users, room) {
    let count = 0
    _.each(users, (user) => { if(user.rooms.includes(room)) count++ })
    return count
  }

  // Lifecycle method 1
  componentDidMount() {

    /* All Listeners */
    // listener, whenever the server emits 'updateChat', this updates the chat body
    socket.on('updateChatInfo', (key, value, date) => {
      const messages = this.state.allMessages
      messages.push({ key: key, value: value, date: date })
      console.log('>>>>>value: ', value.includes('User already exists'))
      if(value.includes('User already exists')) this.setState({ allMessages: messages, isLoggedIn: false })
      else this.setState({ allMessages: messages })
    })
    // listener, whenever the server emits 'userJoined'
    socket.on('userJoined', (user) => {
      this.setState({ user: user })
    })
    // listener, whenever the server emits 'updateGlobalData'
    socket.on('updateGlobalData', (data) => {
      this.setState({ allUsers: data.allUsers, allRooms: data.allRooms })
    })

    // Always keeps the scroll down for messages
    this.scrollToBottom()
  }

  // Lifecycle method 2
  componentDidUpdate() {
    this.scrollToBottom()
  }

  // Send messages
  sendMessage(text) {
    console.log('>>>>>>>>>>text: ', text)
    if(!text) return
    const data = {
      room: this.state.user.defaultRoom,
      name: this.state.user.name,
      message: text
    }
    socket.emit('sendMessage', data)

    console.log('>>>>>>>>>data: ', data)

    axios.post(`${this.apiUrl}/v1/chat`, data)
    // return fetch(`${this.apiUrl}/v1/chat`, {
    //   method: 'post',
    //   body: JSON.stringify(data),
    //   headers: { 'Content-Type': 'application/json' }
    // })
      .then((res) => {
        // const results = res.data.result
        console.log('>>>>>>>>>>res: ', res)
      })
      .catch(err => {
        console.log('>>>>>>>>> err : ', err)
        console.log('>>>>>>>>> err : ', JSON.stringify(err, null, 2))
      })
  }

  // Chek Status
  getOrCreateUser() {
    // console.log('>>>state: ', this.state)
    const username = prompt("Please enter your username:")
    if(username == null) {
      const messages = this.state.allMessages
      messages.push({ key: 'SERVER', value: 'No username was given.', date: new Date().toLocaleString() })
      this.setState({ allMessages: messages, isLoggedIn: false })
    }
    else {
      this.setState({ isLoggedIn: true })
      socket.emit('addUser', username)
    }
  }

  // add New Room
  addNewRoom() {
    const newRoom = prompt("Please enter your new room's name:")
    socket.emit('addRoom', this.state.user.defaultRoom, newRoom)
  }

  // Switch Room
  switchRoom(room) {
    socket.emit('switchRoom', this.state.user.defaultRoom, room)
  }

  // Leave Room
  leaveRoom() {
    socket.emit('removeRoom', this.state.user, this.state.user.defaultRoom)
  }

  // Join Room
  joinRoom(room) {
    socket.emit('switchRoom', this.state.user.defaultRoom, room)
  }

  // Check text changed to see if user is typing
  checkTextChange() {

  }

  render() {
    const { allUsers, allRooms, allMessages, isLoading, isTyping, isLoggedIn, user } = this.state
    console.log('>>>>>>>>allUsers: ', allUsers)

    let messageInput
    const messages = allMessages.map((msg) => { return (<Message message={msg} user={user}></Message>) })

    // Render JSX
    return (
      <div className="App">

        {/* Header */}
        <Container className="App-header">
          <Row>
            <Col xs={3} md={2}>
              <header>
                &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;
                <img src={logo} className="App-logo" alt="logo" />
              </header>
            </Col>
            <Col>
              <p className="App-name"><strong>Chat Room</strong>  { user.name ? ` -- Hello, ${user.name}` : '' }</p>
              &nbsp;&nbsp;
              {isLoading && <div className='App-loading'></div>}
            </Col>
            <Col>
              { !isLoggedIn && <Button variant="primary" className="addNewUser" onClick={ this.getOrCreateUser }>Signin / Signup</Button>}
            </Col>
          </Row>
        </Container>

        {/* Chat Box */}
        <Container className="chatBox">
          <Row>
            <Col xs={6} md={4} >

              <br></br>

              {/* My Rooms */}
              <Row>
                <Col>
                  <Card border="primary">
                    <Card.Header>My Rooms (Click to switch)</Card.Header>
                    <ListGroup variant="flush">
                      { user.rooms && user.rooms.map(room => {
                        return (<ListGroup.Item action style={{cursor:'pointer'}} onClick={()=>{ this.switchRoom(room) }}>{room}</ListGroup.Item>)
                      }) }
                    </ListGroup>
                  </Card>
                </Col>
              </Row>

              <br></br>

              {/* All Rooms */}
              <Row>
                <Col>
                  <Card border="primary">
                    <Card.Header>
                      All Rooms (Click to join)
                      &nbsp;&nbsp;&nbsp;&nbsp;
                      {isLoggedIn && <Button variant="primary" style={{cursor:'pointer'}} className="addNewRoom" onClick={ this.add }>New Room</Button>}
                    </Card.Header>
                    <ListGroup variant="flush">
                      { allRooms.length !== 0 && allRooms.map(room => {
                        return (
                          <ListGroup.Item action style={{cursor:'pointer'}} onClick={()=>{ this.joinRoom(room) }}>
                            {room} ({this.countUsers(allUsers, room)})
                          </ListGroup.Item>
                        )
                      }) }
                    </ListGroup>
                  </Card>
                </Col>
              </Row>

            </Col>

            {/* Room Header Info */}
            <Col xs={12} md={8}>
              <br></br>

              {/* Message Component */}
              <Row>
                <Col>
                  <Card border="primary" >

                    {/* Room Header Info */}
                    <Card.Header >
                      Room Name:&nbsp;&nbsp;"{ user.defaultRoom }"
                      &nbsp;&nbsp;&nbsp;&nbsp;
                      {isLoggedIn && <Button variant="primary" style={{cursor:'pointer'}} className="leaveRoom" onClick={ this.leaveRoom }>Leave</Button>}
                      &nbsp;&nbsp;&nbsp;&nbsp;
                      {isTyping && <small className="text-muted">"User" is typing ...</small>}
                    </Card.Header>

                    {/* Message List */}
                    <Card.Body className="messageBox" ref={this.myRef}>
                      { messages }
                    </Card.Body>

                    {/* Send Message */}
                    <Card.Footer>
                      <Form>
                        <Row >
                          {/* <Col xs={15} md={10}> <Form.Control placeholder="Your Message ..." /> </Col> */}
                          {/* <Col> <Button variant="primary" className="leaveRoom" onClick={ this.add }>Send</Button> </Col> */}
                          <Col>
                            <form className="form-inline">
                              <textarea style={{ height: '100px' }} className="form-control col-md-10" placeholder="Your Message ..." ref = { node => { messageInput = node } } />
                              &nbsp;&nbsp;
                              <Button variant="primary" style={{cursor:'pointer'}} className="leaveRoom" onClick={ (e) => {
                                e.preventDefault();
                                this.sendMessage(messageInput.value)
                                messageInput.value = ''
                              } }>Send</Button>
                            </form>
                          </Col>
                        </Row>
                      </Form>
                    </Card.Footer>

                  </Card>
                </Col>
              </Row>

            </Col>
          </Row>
        </Container>
        {/* <Container className="inputs">
          { cards }
        </Container> */}

      </div>

    )
  }
}

export default App
