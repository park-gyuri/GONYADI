import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';

const FolderCreateModal = ({
  visible,
  onClose,
  onSubmit = () => { },
  initialValue = "",
  mode = "create"
}) => {
  const [folderName, setFolderName] = useState('');

  useEffect(() => {
    setFolderName(initialValue);
  }, [visible, initialValue]);

  const handlePress = () => {
    if (folderName.trim().length > 0) {
      onSubmit(folderName);
      setFolderName('');
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose} statusBarTranslucent={true}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <View style={styles.modalContainer}>
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.backButton}><Text style={styles.backIcon}>←</Text></TouchableOpacity>
              <Text style={styles.headerTitle}>{mode === "create" ? "폴더를 생성하시겠습니까?" : "폴더 이름을 수정할까요?"}</Text>
              <View style={{ width: 40 }} />
            </View>
            <View style={styles.body}>
              <Text style={styles.inputLabel}>폴더 이름</Text>
              <TextInput
                style={styles.textInput}
                value={folderName}
                onChangeText={setFolderName}
                placeholder="이름을 입력하세요"
                autoFocus={true}
              />
              <View style={styles.buttonWrapper}>
                <TouchableOpacity
                  style={styles.createBtn}
                  onPress={handlePress}
                >
                  <Text style={styles.createBtnText}>{mode === "create" ? "생성하기" : "수정하기"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center' },
  keyboardView: { width: '100%', alignItems: 'center' },
  modalContainer: { width: '85%', backgroundColor: '#FFFFFF', borderRadius: 24, overflow: 'hidden', paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderBottomColor: '#E8ECEF' },
  backButton: { padding: 8 },
  backIcon: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  body: { paddingHorizontal: 24, paddingTop: 24 },
  inputLabel: { fontSize: 14, fontWeight: 'bold', color: '#111', marginBottom: 12 },
  textInput: {
    backgroundColor: '#FCFFE8',
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#DCE5B6'
  },
  buttonWrapper: { alignItems: 'flex-end' },
  createBtn: {
    backgroundColor: '#A9E2D9',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#8CCDC2'
  },
  createBtnText: { fontSize: 16, fontWeight: 'bold', color: '#333' }
});

export default FolderCreateModal;