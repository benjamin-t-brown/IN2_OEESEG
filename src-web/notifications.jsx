import React, { useEffect, useState } from 'react';
import expose from 'expose';
import css from 'css';
import utils from './utils';

const NOTIF_TIME_MS = 3000;

const Notification = ({ id, message, severity, remove }) => {
  const [, setTimeoutId] = useState(null);

  useEffect(() => {
    const elem = document.getElementById(id);
    if (elem) {
      elem.style.transform = 'scaleY(1)';
      const timeoutId = setTimeout(() => {
        elem.style.opacity = 0;
        const timeoutId = setTimeout(() => {
          remove(id);
        }, NOTIF_TIME_MS);
        setTimeoutId(timeoutId);
      }, NOTIF_TIME_MS);
      setTimeoutId(timeoutId);
    }
  }, [id, remove, setTimeoutId]);

  const color = (() => {
    switch (severity) {
      case 'error':
        return '#F00';
      case 'warning':
        return '#A46422';
      case 'confirm':
        return '#4B4';
      default:
        return css.colors.TEXT_LIGHT;
    }
  })();

  return (
    <div
      id={id}
      style={{
        margin: '5px',
        padding: '8px 32px',
        transition: 'opacity 1s, transform 150ms',
        transformOrigin: 'top',
        transform: 'scaleY(0)',
        color,
        border: '1px solid white',
        borderRadius: '4px',
        background: '#333',
        pointerEvents: 'all',
        opacity: '1',
      }}
    >
      {message}
    </div>
  );
};

export const notify = (message, severity) => {
  expose.get_state('notifications').notify(message, severity);
};

class NotificationsContainer extends expose.Component {
  constructor(props) {
    super(props);
    this.state = {
      notifications: [],
      notify: (message, severity) => {
        this.setState({
          notifications: [
            ...this.state.notifications,
            {
              id: 'notification_' + utils.random_id(10),
              message,
              severity,
            },
          ],
        });
      },
    };

    this.removeNotification = id => {
      const ind = this.state.notifications.findIndex(n => n.id === id);
      if (ind > -1) {
        const newArray = this.state.notifications.slice();
        newArray.splice(ind, 1);
        this.setState({
          notifications: newArray,
        });
      }
    };

    this.expose('notifications');
  }

  render() {
    return (
      <div
        style={{
          position: 'fixed',
          left: '0',
          top: '0',
          width: '100%',
          pointerEvents: 'none',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          zIndex: 99,
        }}
      >
        {this.state.notifications.map(({ message, severity, id }) => {
          return (
            <Notification
              id={id}
              key={id}
              message={message}
              severity={severity}
              remove={() => this.removeNotification(id)}
            />
          );
        })}
      </div>
    );
  }
}

export default NotificationsContainer;
