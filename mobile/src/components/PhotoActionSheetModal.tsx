import React from 'react'
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Camera, Image as ImageIcon, X } from 'lucide-react-native'
import type { ThemeColors } from '../theme/colors'

export type SelectedPhoto = {
  base64: string
  fileName: string
  fileSize: number
}

export function PhotoActionSheetModal({
  visible,
  colors,
  onClose,
  onPhotoSelected,
}: {
  visible: boolean
  colors: ThemeColors
  onClose: () => void
  onPhotoSelected: (photo: SelectedPhoto) => void
}) {
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please allow camera access in your device settings to capture memories.'
        )
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      })

      if (!result.canceled && result.assets[0]?.base64) {
        const asset = result.assets[0]
        const base64Str = asset.base64
        if (base64Str) {
          onClose()
          onPhotoSelected({
            base64: base64Str,
            fileName: asset.fileName || `camera_${Date.now()}.jpg`,
            fileSize: asset.fileSize || 120000,
          })
        }
      }
    } catch (err) {
      console.error('Camera capture error:', err)
      Alert.alert('Camera Error', 'Could not access the camera. Please try again.')
    }
  }

  const handleChooseFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Photo Library Permission Required',
          'Please allow photo library access in your device settings to select photos.'
        )
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: false,
        quality: 0.8,
        base64: true,
      })

      if (!result.canceled && result.assets[0]?.base64) {
        const asset = result.assets[0]
        const base64Str = asset.base64
        if (base64Str) {
          onClose()
          onPhotoSelected({
            base64: base64Str,
            fileName: asset.fileName || `gallery_${Date.now()}.jpg`,
            fileSize: asset.fileSize || 120000,
          })
        }
      }
    } catch (err) {
      console.error('Gallery selection error:', err)
      Alert.alert('Gallery Error', 'Could not open your photos. Please try again.')
    }
  }


  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          {/* Sheet Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Add Photo to Memory</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Option: Take Photo */}
          <TouchableOpacity
            style={[styles.optionRow, { borderBottomColor: colors.border }]}
            activeOpacity={0.7}
            onPress={handleTakePhoto}
          >
            <View style={[styles.iconWrapper, { backgroundColor: colors.pill }]}>
              <Camera size={18} color={colors.accent} />
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionLabel, { color: colors.text }]}>Take Photo</Text>
              <Text style={[styles.optionSub, { color: colors.textMuted }]}>Use your camera now</Text>
            </View>
          </TouchableOpacity>

          {/* Option: Choose from Gallery */}
          <TouchableOpacity
            style={[styles.optionRow, { borderBottomColor: colors.border }]}
            activeOpacity={0.7}
            onPress={handleChooseFromGallery}
          >
            <View style={[styles.iconWrapper, { backgroundColor: colors.pill }]}>
              <ImageIcon size={18} color={colors.accent} />
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionLabel, { color: colors.text }]}>Choose from Gallery</Text>
              <Text style={[styles.optionSub, { color: colors.textMuted }]}>Select from photo library</Text>
            </View>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: colors.pill, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={onClose}
          >
            <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  optionSub: {
    fontSize: 11,
    marginTop: 2,
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
})
