import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const LoginScreen = () => {
  const router = useRouter();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // 임시로 바로 메인화면(홈)으로 넘어가도록 설정
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.card}>
          <Text style={styles.title}>MYROUTE</Text>
          <Text style={styles.subtitle}>LOGIN</Text>

          <TextInput
            style={styles.input}
            placeholder="ID"
            placeholderTextColor="#999"
            value={id}
            onChangeText={setId}
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="PASSWORD"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
            <Text style={styles.loginBtnText}>LOGIN</Text>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>계정이 없나요? </Text>
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text style={styles.signupLink}>회원가입 하러가기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7', // 매우 연한 회색 배경
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7A7A7A',
    padding: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#FEFEEB', // 연한 노란색
    borderWidth: 1,
    borderColor: '#DCE5B6',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  loginBtn: {
    width: '100%',
    height: 50,
    backgroundColor: '#AEE4D7', // 민트색
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  loginBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  signupContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  signupText: {
    fontSize: 14,
    color: '#666',
  },
  signupLink: {
    fontSize: 14,
    color: '#1A6EB5',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
