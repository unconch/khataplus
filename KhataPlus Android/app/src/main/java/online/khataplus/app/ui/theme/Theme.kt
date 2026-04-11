package online.khataplus.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val KhataLightScheme = lightColorScheme(
    primary = Emerald,
    secondary = Teal,
    tertiary = Gold,
    background = Sand,
    surface = Color.White,
    surfaceVariant = Paper,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onTertiary = Night,
    onBackground = Night,
    onSurface = Night,
    onSurfaceVariant = Color(0xFF475569),
    outline = Color(0xFFB8C7BB)
)

@Composable
fun KhataPlusTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = KhataLightScheme,
        content = content
    )
}
