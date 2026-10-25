# Reference only, not run by this site's checks; needs a ROS 2 install (for example Jazzy).
import rclpy
from rclpy.node import Node
from rclpy.qos import qos_profile_sensor_data
from sensor_msgs.msg import Imu

class ImuPublisher(Node):
    def __init__(self):
        super().__init__('imu_publisher')
        self.pub = self.create_publisher(Imu, 'imu/data', qos_profile_sensor_data)   # best effort, keep last 5
        self.create_timer(1.0 / 200.0, self.tick)

    def tick(self):
        msg = Imu()
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.header.frame_id = 'imu_link'
        msg.linear_acceleration.z = 9.81
        self.pub.publish(msg)

class ImuSubscriber(Node):
    def __init__(self):
        super().__init__('imu_subscriber')
        self.create_subscription(Imu, 'imu/data', self.cb, qos_profile_sensor_data)

    def cb(self, msg):
        age = self.get_clock().now() - rclpy.time.Time.from_msg(msg.header.stamp)
        self.get_logger().debug(f'az {msg.linear_acceleration.z:.2f}, age {age.nanoseconds / 1e6:.2f} ms')
