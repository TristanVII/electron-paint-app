package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/redis/go-redis/v9"
	"golang.org/x/net/websocket"
)

type Drawing struct {
	X           int    `json:"x"`
	Y           int    `json:"y"`
	LineWidth   int    `json:"lineWidth"`
	StrokeStyle string `json:"strokeStyle"`
}

type Content struct {
	Id     string  `json:"id"`
	RoomId string  `json:"room_id"`
	Data   Drawing `json:"data,omitempty"`
}

type ErrorMessage struct {
	Message_type string `json:"message_type"`
	Content      string `json:"content"`
}

type Message struct {
	Message_type string  `json:"message_type"`
	Content      Content `json:"content"`
}

type Server struct {
	conns map[string]*websocket.Conn
	rdb   *redis.Client
}

func newServer() *Server {
	return &Server{
		// id:Websocket
		conns: make(map[string]*websocket.Conn),

		rdb: redis.NewClient(&redis.Options{
			Addr:     "localhost:6379",
			Password: "", // No password
			DB:       0,  // Default DB
		}),
	}
}

func (s *Server) handleWS(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	roomID := "roomID:" + vars["room_id"]

	ctx := r.Context()
	err := s.rdb.Ping(ctx).Err()

	if err != nil {
		fmt.Println(err)
		panic(err)
	}

	err = s.rdb.SAdd(ctx, roomID, id).Err()

	if err != nil {
		fmt.Printf("failed to set %s to %s", id, roomID)
	}

	fmt.Println("new connection from: ", r.RemoteAddr)
	fmt.Println("ID:", id)
	fmt.Println("Room ID:", roomID)

	// WebSocket handling
	ws := websocket.Handler(func(conn *websocket.Conn) {
		s.handleWebSocket(conn, id)
	})
	ws.ServeHTTP(w, r)
}

func (s *Server) handleWebSocket(ws *websocket.Conn, id string) {
	s.conns[id] = ws
	s.readLoop(ws)
}

func filterValue(arr []string, valueToRemove string) []string {
	var result []string

	for _, v := range arr {
		if v != valueToRemove {
			result = append(result, v)
		}
	}

	return result
}

func (s *Server) readLoop(ws *websocket.Conn) {
	ctx := ws.Request().Context()
	for {
		var receivedMessage Message

		// Read from the WebSocket connection
		err := websocket.JSON.Receive(ws, &receivedMessage)
		if err != nil {
			fmt.Println("Error reading from WebSocket:", err)
			break
		}

		switch receivedMessage.Message_type {
		case "join":
			var joinContent Content
			joinContent = receivedMessage.Content

			roomKey := "roomID:" + joinContent.RoomId
			exist, err := s.rdb.Exists(ctx, roomKey).Result()
			if err != nil {
				fmt.Println("Error checking if room exists:", err)
				return
			}

			if exist == 0 {
				// RoomId does not exist, send an error message to the client
				errorMessage := ErrorMessage{
					Message_type: "error",
					Content:      "Room does not exist",
				}

				// Encode the error message into JSON
				errorJSON, err := json.Marshal(errorMessage)
				if err != nil {
					fmt.Println("Error encoding error message:", err)
					return
				}

				// Send the JSON-encoded error message to the client
				ws.Write(errorJSON)
				return
			}

			err = s.rdb.SAdd(ctx, roomKey, joinContent.Id).Err()

			if err != nil {
				fmt.Println("Error Joining", err)
				return
			}

			// TODO: CREATE NEW FUC SINCE SAME AS RESET
			var content Content
			content = receivedMessage.Content
			message := Message{
				Message_type: "reset",
				Content:      content,
			}

			jsonMessage, err := json.Marshal(message)
			if err != nil {
				fmt.Println(err)
				return
			}
			for _, con := range s.conns {
				con.Write(jsonMessage)
			}

		case "drawing":
			var drawingContent Drawing
			drawingContent = receivedMessage.Content.Data

			content := Content{
				Data: drawingContent,
			}
			message := Message{
				Message_type: "drawing",
				Content:      content,
			}

			jsonMessage, err := json.Marshal(message)
			if err != nil {
				fmt.Println(err)
				return
			}
			for _, con := range s.conns {
				con.Write(jsonMessage)
			}

		case "close", "leave":
			// TODO: Delete the room if empty
			var cont Content
			cont = receivedMessage.Content
			// Handle close or leave event...
			roomKey := "roomID:" + cont.RoomId
			groups, err := s.rdb.SMembers(ctx, roomKey).Result()
			if err != nil {
				fmt.Println("Failed to retrieve members", err)
				return
			}
			groups = filterValue(groups, cont.Id)

			print("New Group Consists of: ")
			for _, val := range groups {
				fmt.Printf("%s ,", val)
				err = s.rdb.SAdd(ctx, roomKey, val).Err()
			}

		case "reset":
			var content Content
			content = receivedMessage.Content
			message := Message{
				Message_type: "reset",
				Content:      content,
			}

			jsonMessage, err := json.Marshal(message)
			if err != nil {
				fmt.Println(err)
				return
			}
			for _, con := range s.conns {
				con.Write(jsonMessage)
			}

		default:
			fmt.Println("INVALID MESSAGE", receivedMessage)
		}
	}
}
