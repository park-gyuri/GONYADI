import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const ReviewSaveModal = ({ visible, onClose, onSave }) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>후기를 저장하시겠습니까?</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Body */}
          <View style={styles.body}>
            <Text style={styles.sectionTitle}>[이용약관 동의]</Text>
            <Text style={styles.description}>
              해당 후기는 서비스 품질 향상을 위한 추천 알고리즘{"\n"}개선에 이용됩니다.
            </Text>

            <TouchableOpacity
              style={styles.checkboxRow}
              activeOpacity={0.7}
              onPress={() => setAgreed(!agreed)}
            >
              <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
                {agreed && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxText}>이에 동의하십니까?</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveBtn, !agreed && styles.saveBtnDisabled]}
              onPress={() => agreed && onSave()}
            >
              <Text style={styles.saveBtnText}>저장하기</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '90%', backgroundColor: '#FFFFFF', borderRadius: 24, paddingBottom: 20, overflow: 'hidden' },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderBottomColor: '#F0F3F5' },
  backBtn: { padding: 8 },
  backIcon: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },

  body: { paddingHorizontal: 32, paddingVertical: 24, alignItems: 'flex-start' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#107676', marginBottom: 15, textAlign: 'left' },
  description: { fontSize: 14, color: '#111', lineHeight: 22, marginBottom: 25, textAlign: 'left' },

  checkboxRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#FCFFE8',
    borderWidth: 1,
    borderColor: '#DCE5B6',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxActive: { backgroundColor: '#A9E2D9', borderColor: '#8CCDC2' },
  checkmark: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  checkboxText: { fontSize: 14, color: '#111' },

  footer: { alignItems: 'flex-end', paddingHorizontal: 20, marginTop: 10 },
  saveBtn: { backgroundColor: '#A9E2D9', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 30 },
  saveBtnDisabled: { backgroundColor: '#E8ECEF' },
  saveBtnText: { fontSize: 18, fontWeight: 'bold', color: '#111' },
});

export default ReviewSaveModal;
