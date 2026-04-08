import React, {useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {WebView} from 'react-native-webview';
import {useEditorStore} from '../../store/editorStore';

const EDITOR_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #1A1A1A; display: flex; justify-content: center; align-items: center; height: 100vh; }
    canvas { border: 1px solid #333; max-width: 100%; max-height: 100%; }
    .empty { color: #666; font-family: -apple-system, sans-serif; font-size: 18px; text-align: center; padding: 40px; }
  </style>
</head>
<body>
  <div class="empty" id="placeholder">
    <p>Select a template to start editing</p>
    <p style="font-size:14px;margin-top:8px;color:#555">Choose a template from Home, then tap "Open in Editor"</p>
  </div>
  <canvas id="canvas" style="display:none"></canvas>
  <script>
    // fabric.js will be loaded from CDN in production
    // Bridge: receive template JSON from RN
    window.addEventListener('message', function(event) {
      try {
        var msg = JSON.parse(event.data);
        if (msg.type === 'LOAD_TEMPLATE') {
          document.getElementById('placeholder').style.display = 'none';
          document.getElementById('canvas').style.display = 'block';
          // Initialize fabric.js canvas with template layers
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'TEMPLATE_LOADED',
            layerCount: msg.template.layers.length
          }));
        }
        if (msg.type === 'EXPORT') {
          // Export canvas as base64 image
          var dataUrl = document.getElementById('canvas').toDataURL('image/png');
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'EXPORT_RESULT',
            data: dataUrl
          }));
        }
      } catch(e) {}
    });
  </script>
</body>
</html>
`;

export default function EditorScreen() {
  const webViewRef = useRef<WebView>(null);
  const {template, canUndo, canRedo, undo, redo} = useEditorStore();

  function handleMessage(event: any) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'TEMPLATE_LOADED') {
        // Template loaded in WebView
      }
      if (msg.type === 'EXPORT_RESULT') {
        // Handle exported image base64
      }
    } catch {
      // Invalid message
    }
  }

  function sendToWebView(message: object) {
    webViewRef.current?.postMessage(JSON.stringify(message));
  }

  function handleExport() {
    sendToWebView({type: 'EXPORT'});
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{html: EDITOR_HTML}}
        style={styles.webview}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        originWhitelist={['*']}
      />

      {/* Bottom Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.toolButton, !canUndo() && styles.toolButtonDisabled]}
          onPress={undo}
          disabled={!canUndo()}>
          <Text style={styles.toolButtonText}>Undo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolButton, !canRedo() && styles.toolButtonDisabled]}
          onPress={redo}
          disabled={!canRedo()}>
          <Text style={styles.toolButtonText}>Redo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolButton}>
          <Text style={styles.toolButtonText}>Text</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolButton}>
          <Text style={styles.toolButtonText}>Image</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolButton}>
          <Text style={styles.toolButtonText}>Sticker</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolButton, styles.exportButton]}
          onPress={handleExport}>
          <Text style={[styles.toolButtonText, styles.exportText]}>
            Export
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  webview: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  toolbar: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  toolButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 2,
  },
  toolButtonDisabled: {
    opacity: 0.4,
  },
  toolButtonText: {
    color: '#CCC',
    fontSize: 12,
    fontWeight: '600',
  },
  exportButton: {
    backgroundColor: '#FF6B35',
  },
  exportText: {
    color: '#FFF',
  },
});
