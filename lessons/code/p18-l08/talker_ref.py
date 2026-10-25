# Reference only, not run by this site's checks; needs a ROS 2 install (for example Jazzy).
import rclpy
from rclpy.node import Node
from rclpy.callback_groups import MutuallyExclusiveCallbackGroup
from rclpy.executors import MultiThreadedExecutor
from std_msgs.msg import String
from example_interfaces.srv import AddTwoInts

class Talker(Node):
    def __init__(self):
        super().__init__('talker')
        self.pub = self.create_publisher(String, 'chatter', 10)
        self.n = 0
        self.create_timer(0.1, self.tick)
        self.cli = self.create_client(AddTwoInts, 'add_two_ints', callback_group=MutuallyExclusiveCallbackGroup())

    def tick(self):
        self.pub.publish(String(data=f'hello {self.n}')); self.n += 1
        fut = self.cli.call_async(AddTwoInts.Request(a=2, b=3))     # never block inside a callback
        fut.add_done_callback(lambda f: self.get_logger().info(f'sum {f.result().sum}'))

def main():
    rclpy.init()
    ex = MultiThreadedExecutor(); ex.add_node(Talker()); ex.spin()
