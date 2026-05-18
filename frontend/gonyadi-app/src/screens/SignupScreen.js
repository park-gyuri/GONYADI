import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { apiClient } from '../api/apiClient';

const SignupScreen = () => {
  const router = useRouter();

  // 입력 필드
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [id, setId] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  // 상태 관리
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  // 1단계: 이메일로 인증코드 발송
  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert('알림', '이메일을 입력해주세요.');
      return;
    }

    setIsSendingCode(true);
    try {
      await apiClient(`/api/v1/auth/send-verification?email=${encodeURIComponent(email)}`, {
        method: 'POST',
      });
      setIsCodeSent(true);
      Alert.alert('발송 완료', '인증 코드가 이메일로 발송되었습니다.');
    } catch (error) {
      Alert.alert('발송 실패', error.message || '이메일 형식을 다시 확인해주세요.');
    } finally {
      setIsSendingCode(false);
    }
  };

  // 2단계: 인증코드 확인
  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      Alert.alert('알림', '인증 코드를 입력해주세요.');
      return;
    }

    setIsVerifying(true);
    try {
      await apiClient(`/api/v1/auth/verify-code?email=${encodeURIComponent(email)}&code=${encodeURIComponent(verificationCode)}`, {
        method: 'POST',
      });
      setIsEmailVerified(true);
      Alert.alert('인증 완료', '이메일 인증이 완료되었습니다!');
    } catch (error) {
      Alert.alert('인증 실패', error.message || '인증 번호가 틀렸거나 만료되었습니다.');
    } finally {
      setIsVerifying(false);
    }
  };

  // 3단계: 회원가입
  const handleSignup = async () => {
    if (!id.trim() || !nickname.trim() || !password.trim()) {
      Alert.alert('알림', '모든 항목을 입력해주세요.');
      return;
    }
    if (password !== passwordConfirm) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!isEmailVerified) {
      Alert.alert('알림', '이메일 인증을 먼저 완료해주세요.');
      return;
    }

    setIsSigningUp(true);
    try {
      await apiClient('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          user_id: id,
          user_password: password,
          user_nickname: nickname,
          user_email: email,
        }),
      });
      Alert.alert('가입 완료', '회원가입이 완료되었습니다! 로그인 해주세요.', [
        { text: '확인', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('가입 실패', error.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>

            <Text style={styles.title}>MYROUTE</Text>
            <Text style={styles.subtitle}>SIGN UP</Text>

            {/* ── 이메일 인증 영역 ── */}
            <Text style={styles.sectionLabel}>이메일 인증</Text>
            <View style={styles.rowInput}>
              <TextInput
                style={[styles.input, styles.rowInputField, isEmailVerified && styles.inputDisabled]}
                placeholder="이메일 (ex: abc@gmail.com)"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isEmailVerified}
              />
              <TouchableOpacity
                style={[styles.smallBtn, isEmailVerified && styles.smallBtnDisabled]}
                onPress={handleSendCode}
                disabled={isEmailVerified || isSendingCode}
              >
                {isSendingCode ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.smallBtnText}>{isCodeSent ? '재발송' : '인증발송'}</Text>
                )}
              </TouchableOpacity>
            </View>

            {isCodeSent && !isEmailVerified && (
              <View style={styles.rowInput}>
                <TextInput
                  style={[styles.input, styles.rowInputField]}
                  placeholder="인증 코드 6자리"
                  placeholderTextColor="#999"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={handleVerifyCode}
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text style={styles.smallBtnText}>인증확인</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {isEmailVerified && (
              <Text style={styles.verifiedText}>✅ 이메일 인증 완료</Text>
            )}

            {/* ── 회원 정보 입력 ── */}
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>회원 정보</Text>
            <TextInput
              style={[styles.input, !isEmailVerified && styles.inputDisabled]}
              placeholder="아이디"
              placeholderTextColor="#999"
              value={id}
              onChangeText={setId}
              autoCapitalize="none"
              editable={isEmailVerified}
            />

            <TextInput
              style={[styles.input, !isEmailVerified && styles.inputDisabled]}
              placeholder="닉네임"
              placeholderTextColor="#999"
              value={nickname}
              onChangeText={setNickname}
              editable={isEmailVerified}
            />

            <TextInput
              style={[styles.input, !isEmailVerified && styles.inputDisabled]}
              placeholder="비밀번호"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={isEmailVerified}
            />

            <TextInput
              style={[styles.input, !isEmailVerified && styles.inputDisabled]}
              placeholder="비밀번호 확인"
              placeholderTextColor="#999"
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              secureTextEntry
              editable={isEmailVerified}
            />

            <TouchableOpacity
              style={[styles.signupBtn, (!isEmailVerified || isSigningUp) && styles.signupBtnDisabled]}
              onPress={handleSignup}
              disabled={!isEmailVerified || isSigningUp}
            >
              {isSigningUp ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.signupBtnText}>SIGN UP</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
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
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    top: 15,
    left: 15,
    padding: 5,
  },
  backIcon: {
    fontSize: 24,
    color: '#000',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  sectionLabel: {
    alignSelf: 'flex-start',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#FEFEEB',
    borderWidth: 1,
    borderColor: '#DCE5B6',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 12,
    fontSize: 15,
  },
  inputDisabled: {
    backgroundColor: '#EFEFEF',
    borderColor: '#CCC',
  },
  rowInput: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 0,
  },
  rowInputField: {
    flex: 1,
  },
  smallBtn: {
    height: 50,
    paddingHorizontal: 14,
    backgroundColor: '#AEE4D7',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallBtnDisabled: {
    opacity: 0.5,
  },
  smallBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000',
  },
  verifiedText: {
    alignSelf: 'flex-start',
    fontSize: 14,
    color: '#2E8B57',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  signupBtn: {
    width: '100%',
    height: 50,
    backgroundColor: '#AEE4D7',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  signupBtnDisabled: {
    opacity: 0.5,
  },
  signupBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
});

export default SignupScreen;
