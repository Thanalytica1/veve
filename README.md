# Fitness Trainer Management App

A React Native app built with Expo Router for managing clients, sessions, and scheduling for fitness trainers.

## Features

### 📊 Dashboard
- KPI tracking with session completion metrics
- Revenue analytics with sparkline charts
- Client growth monitoring
- Session trends visualization

### 👥 Client Management
- Complete CRUD operations for client records
- Client profiles with contact information
- Package management (sessions remaining, pricing)
- Session history tracking
- Search and sort functionality
- Session completion workflow

### 📅 Calendar & Scheduling
- Month view calendar with session visualization
- Day agenda with session details
- Add/edit/delete sessions
- Conflict detection for overlapping sessions
- Recurring session support
- Timezone-aware scheduling
- Status tracking (booked, completed, cancelled, no-show)

### 📱 Session Management
- Session tracking with client association
- Time range validation
- Location and notes support
- Status management workflow

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **Storage**: AsyncStorage for local data persistence
- **UI Components**: React Native core components
- **Calendar**: react-native-calendars
- **Icons**: Expo Vector Icons
- **TypeScript**: Full type safety

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio/Emulator (for Android development)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd my-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install required packages**
   ```bash
   npm install react-native-calendars
   npm install @react-native-async-storage/async-storage
   npm install @expo/vector-icons
   npm install expo-router
   npm install react-native-svg
   npm install uuid react-native-get-random-values
   ```

4. **Start the development server**
   ```bash
   npm start
   # or
   npx expo start
   ```

5. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on physical device

## Project Structure

```
my-app/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation
│   │   ├── calendar.tsx   # Calendar screen
│   │   ├── dashboard.tsx  # Dashboard screen
│   │   ├── index.tsx      # Clients screen
│   │   ├── two.tsx        # Sessions screen
│   │   └── _layout.tsx    # Tab layout
│   ├── modal.tsx          # Modal screen
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
│   ├── Calendar.tsx       # Calendar component
│   ├── ClientForm.tsx     # Client form
│   ├── ClientsList.tsx    # Clients list
│   ├── CompleteSession.tsx # Session completion
│   ├── Dashboard.tsx      # Dashboard component
│   ├── KPICards.tsx       # KPI metrics
│   └── Sparkline.tsx      # Chart component
├── constants/             # App constants
│   └── Colors.ts          # Color definitions
├── lib/                   # Utility libraries
│   └── date.ts            # Date utilities
├── storage/               # Data persistence
│   └── clientStorage.ts   # Client storage adapter
├── types/                 # TypeScript types
│   └── client.ts          # Client interfaces
└── utils/                 # Helper utilities
    └── validation.ts      # Validation functions
```

## Data Models

### Client
```typescript
interface Client {
  id: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  tags: string[];
  notes: string | null;
  package: ClientPackage;
  dates: ClientDates;
  sessionHistory: SessionHistoryEntry[];
}
```

### Session
```typescript
interface Session {
  id: string;
  clientId: string;
  clientName?: string;
  date: string; // YYYY-MM-DD
  startISO: string; // UTC ISO
  endISO: string; // UTC ISO
  status: 'booked' | 'completed' | 'cancelled' | 'no-show';
  location?: string;
  notes?: string;
  recurring?: boolean;
}
```

## Key Components

### Calendar Component
- **Location**: `components/Calendar.tsx`
- **Props**: Supports session loading, CRUD operations, conflict detection
- **Features**: Month navigation, day agenda, session creation modal

### Client Management
- **Location**: `components/ClientsList.tsx` + `components/ClientForm.tsx`
- **Features**: Full CRUD, search/sort, session tracking

### Dashboard
- **Location**: `components/Dashboard.tsx` + `components/KPICards.tsx`
- **Features**: Analytics, metrics, visual charts

## Development Guidelines

### Adding New Features

1. **Create components** in `components/` directory
2. **Add screens** in `app/` directory using Expo Router conventions
3. **Define types** in `types/` directory
4. **Create utilities** in `lib/` or `utils/` directories
5. **Update storage** in `storage/` if data persistence is needed

### State Management
- Local component state with `useState`
- AsyncStorage for data persistence
- Props drilling for component communication

### Styling
- StyleSheet API for component styling
- Consistent color scheme from `constants/Colors.ts`
- Responsive design principles

### Data Persistence
- AsyncStorage for local data storage
- JSON serialization for complex objects
- Storage adapters in `storage/` directory

## Testing

```bash
# Type checking
npx tsc --noEmit

# Start development server
npm start

# Build for production
npx expo build
```

## Configuration

### Environment Setup
- No environment variables required for basic functionality
- All data stored locally via AsyncStorage

### Customization
- **Colors**: Modify `constants/Colors.ts`
- **Navigation**: Update `app/(tabs)/_layout.tsx`
- **Storage**: Extend `storage/clientStorage.ts`

## Deployment

### Development
```bash
npm start
```

### Production Build
```bash
npx expo build:ios
npx expo build:android
```

### Publishing to Expo
```bash
npx expo publish
```

## Troubleshooting

### Common Issues

1. **Metro bundler port conflicts**
   ```bash
   npx expo start --port 8082
   ```

2. **Package version mismatches**
   ```bash
   npx expo install --fix
   ```

3. **AsyncStorage issues**
   - Clear app data on device/simulator
   - Check storage key consistency

4. **Calendar display issues**
   - Ensure react-native-calendars is properly installed
   - Check date format consistency (YYYY-MM-DD)

### Debug Mode
- Enable remote debugging in Expo dev tools
- Use React Native Debugger for advanced debugging
- Check Metro bundler logs for compilation errors

## Contributing

1. Follow TypeScript best practices
2. Maintain consistent code style
3. Add proper error handling
4. Update documentation for new features
5. Test on both iOS and Android platforms

## License

[Add your license information here]

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review Expo Router documentation
3. Check React Native documentation
4. Create an issue in the repository