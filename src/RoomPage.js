import {Room} from 'livekit-client';
import {useParticipant, useRoom} from 'livekit-react-native';
import * as React from 'react';
import {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {ParticipantView} from './ParticipantView';
import {RoomControls} from './RoomControls';

const LIVEKET_SERVER_URL = 'wss://sfu.peacegarden.live';
const TOKEN_SERVER_URL =
  'https://sfu-api.peacegarden.live/create-room-access-token';

export const RoomPage = ({navigation, route}) => {
  const [, setIsConnected] = useState(false);
  const [room] = useState(
    () =>
      new Room({
        publishDefaults: {simulcast: false},
        adaptiveStream: true,
      }),
  );
  const {participants} = useRoom(room);
  const {userName, roomName} = route.params;
  const [token, setToken] = useState();

  useEffect(() => {
    const fn = async () => {
      const body = JSON.stringify({
        identity: userName,
        name: userName,
        room: roomName,
        ttl: '1d',
      });

      const res = await fetch(TOKEN_SERVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: body,
      });

      const data = await res.json();
      setToken(data.data.token);
    };
    fn();
  }, [userName, roomName]);

  useEffect(() => {
    if (token) {
      console.log('Connecting to ROOM....');
      room
        .connect(LIVEKET_SERVER_URL, token, {})
        // .then(r => {
        //   if (!r) {
        //     console.log('Failed to connect');
        //     return;
        //   }
        //   console.log('Connected');
        //   setIsConnected(true);
        // })
        .catch(err => {
          console.error('Error Connecting to Room', err);
        });

      return () => {
        room.disconnect();
      };
    } else {
      console.log('NO TOKEN WHILE ROOM CONNECTION');
    }
  }, [token, room]);

  const renderParticipant = ({item}) => {
    return (
      <ParticipantView participant={item} style={styles.otherParticipantView} />
    );
  };

  const {cameraPublication, microphonePublication} = useParticipant(
    room.localParticipant,
  );

  function isTrackEnabled(data) {
    return !(data?.isMuted ?? true);
  }

  if (participants.length && participants[0].identity) {
    return (
      <View style={styles.container}>
        <ParticipantView participant={participants[0]} style={styles.stage} />

        <FlatList
          data={participants}
          renderItem={renderParticipant}
          keyExtractor={item => item.sid}
          horizontal={true}
          style={styles.otherParticipantsList}
        />

        <RoomControls
          micEnabled={isTrackEnabled(microphonePublication)}
          setMicEnabled={enabled => {
            room.localParticipant.setMicrophoneEnabled(enabled);
          }}
          cameraEnabled={isTrackEnabled(cameraPublication)}
          setCameraEnabled={enabled => {
            room.localParticipant.setCameraEnabled(enabled);
          }}
          onDisconnectClick={() => {
            navigation.pop();
          }}
        />
      </View>
    );
  } else {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="white" />
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    flex: 1,
    width: '100%',
  },
  otherParticipantsList: {
    width: '100%',
    height: 150,
    flexGrow: 0,
  },
  otherParticipantView: {
    width: 150,
    height: 150,
  },
  text: {
    color: 'white',
  },
});
